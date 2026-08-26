from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from services.auth_service import decode_token, get_user_by_id

# Routes that don't need authentication
PUBLIC_ROUTES = [
    "/",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/health",
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/verify-email",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/achievements/leaderboard",
]


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Allow preflight CORS
        if request.method == "OPTIONS":
            return await call_next(request)

        # Check if route is public
        is_public = any(
            path == route or path.startswith(route + "/") for route in PUBLIC_ROUTES
        )

        if is_public:
            return await call_next(request)

        # Extract token
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Authentication required",
                    "data": None,
                },
            )

        token = auth_header.split(" ")[1]
        payload = decode_token(token)

        if not payload or payload.get("type") != "access":
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid or expired token",
                    "data": None,
                },
            )

        user_id = payload.get("sub")
        user = await get_user_by_id(user_id)

        if not user:
            return JSONResponse(
                status_code=401,
                content={"success": False, "message": "User not found", "data": None},
            )

        # Attach user to request state
        request.state.user = user

        response = await call_next(request)
        return response
