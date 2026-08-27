from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None


db = Database()


def get_database():
    if db.client is None or not settings.MONGODB_DB:
        raise RuntimeError(
            "MongoDB is unavailable. Set MONGODB_URI and MONGODB_DB environment variables before using database-backed routes."
        )
    return db.client[settings.MONGODB_DB]


async def ensure_index(collection, keys, *, name=None, **options):
    """Create an index only when its existing definition does not match."""
    index_name = name or "_".join(f"{field}_{direction}" for field, direction in keys)
    try:
        indexes = await collection.index_information()
        existing = indexes.get(index_name)
        if existing:
            existing_keys = [(field, direction) for field, direction in existing["key"]]
            requested_keys = [(field, direction) for field, direction in keys]
            existing_options = {
                key: existing.get(key, False)
                for key in ("unique", "sparse", "expireAfterSeconds")
            }
            requested_options = {
                key: options.get(key, False)
                for key in ("unique", "sparse", "expireAfterSeconds")
            }
            if (
                existing_keys == requested_keys
                and existing_options == requested_options
            ):
                return index_name

            logger.warning(
                "MongoDB index conflict for %s: existing=%s requested=%s; keeping existing index",
                index_name,
                existing,
                {"key": requested_keys, **requested_options},
            )
            return index_name

        return await collection.create_index(keys, name=index_name, **options)
    except Exception:
        logger.exception(
            "Unable to ensure MongoDB index %s; continuing startup", index_name
        )
        return None
