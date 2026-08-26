from fastapi import APIRouter, HTTPException, Response, Request, Depends
from bson import ObjectId
from models.user import (
    UserCreate,
    UserLogin,
    PasswordReset,
    PasswordResetConfirm,
    ChangePassword,
    TokenResponse,
    OnboardingData,
    UserUpdate,
)
from services.auth_service import (
    create_user,
    authenticate_user,
    get_user_by_id,
    verify_email,
    create_reset_token,
    reset_password,
    update_user,
    format_user_profile,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from services.email_service import (
    send_verification_email,
    send_reset_email,
    send_welcome_email,
)
from services.roadmap_service import ensure_student_for_user
from schemas.responses import StandardResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=StandardResponse)
async def register(data: UserCreate):
    try:
        user, verification_token = await create_user(
            data.name, data.email, data.password
        )
        await ensure_student_for_user(user)
        await send_verification_email(data.email, data.name, verification_token)
        profile = format_user_profile(user)
        # Generate tokens so user is logged in immediately
        access_token = create_access_token(user["_id"])
        refresh_token = create_refresh_token(user["_id"])
        return StandardResponse(
            success=True,
            data={
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": profile,
            },
            message="Account created. Please check your email to verify.",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=StandardResponse)
async def login(data: UserLogin):
    user = await authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await ensure_student_for_user(user)
    profile = format_user_profile(user)
    access_token = create_access_token(user["_id"])
    refresh_token = create_refresh_token(user["_id"], data.remember_me)
    return StandardResponse(
        success=True,
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": profile,
        },
        message="Login successful",
    )


@router.post("/refresh", response_model=StandardResponse)
async def refresh_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Refresh token required")
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    return StandardResponse(
        success=True,
        data={
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "user": format_user_profile(user),
        },
        message="Token refreshed",
    )


@router.post("/verify-email/{token}", response_model=StandardResponse)
async def verify_email_endpoint(token: str):
    success = await verify_email(token)
    if not success:
        raise HTTPException(
            status_code=400, detail="Invalid or expired verification token"
        )
    # Send welcome email (need to find the user to get their info)
    return StandardResponse(success=True, message="Email verified successfully")


@router.post("/forgot-password", response_model=StandardResponse)
async def forgot_password(data: PasswordReset):
    token = await create_reset_token(data.email)
    if token:
        # Find user name for email
        from database import get_database

        db = get_database()
        user = await db.users.find_one({"email": data.email.lower()})
        name = user.get("name", "User") if user else "User"
        await send_reset_email(data.email, name, token)
    # Always return success to prevent email enumeration
    return StandardResponse(
        success=True, message="If the email exists, a reset link has been sent."
    )


@router.post("/reset-password", response_model=StandardResponse)
async def reset_password_endpoint(data: PasswordResetConfirm):
    success = await reset_password(data.token, data.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    return StandardResponse(success=True, message="Password reset successfully")


@router.get("/me", response_model=StandardResponse)
async def get_me(request: Request):
    user = request.state.user
    return StandardResponse(
        success=True, data=format_user_profile(user), message="Profile fetched"
    )


@router.put("/me", response_model=StandardResponse)
async def update_me(data: UserUpdate, request: Request):
    user = request.state.user
    updated = await update_user(user["_id"], data.model_dump(exclude_unset=True))
    return StandardResponse(
        success=True, data=format_user_profile(updated), message="Profile updated"
    )


@router.post("/change-password", response_model=StandardResponse)
async def change_password(data: ChangePassword, request: Request):
    user = request.state.user
    from services.auth_service import verify_password, hash_password
    from database import get_database

    db = get_database()
    # Get user with password
    full_user = await db.users.find_one({"_id": ObjectId(user["_id"])})
    if not verify_password(data.current_password, full_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"password": hash_password(data.new_password)}},
    )
    return StandardResponse(success=True, message="Password changed successfully")


@router.post("/onboarding", response_model=StandardResponse)
async def complete_onboarding(data: OnboardingData, request: Request):
    user = request.state.user
    update_data = data.model_dump(exclude_unset=True)
    update_data["is_onboarded"] = True
    updated = await update_user(user["_id"], update_data)
    return StandardResponse(
        success=True, data=format_user_profile(updated), message="Onboarding complete"
    )
