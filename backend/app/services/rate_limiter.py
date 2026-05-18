import time
import redis.asyncio as aioredis
from app.core.config import settings

REQUESTS_PER_MINUTE = 60

async def get_redis():
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)

async def check_rate_limit(api_key: str) -> tuple[bool, int]:
    """
    Sliding window rate limiter.
    Returns (is_allowed, requests_remaining)
    """
    r = await get_redis()

    now = time.time()
    window_start = now - 60

    key = f"rate_limit:{api_key}"

    pipe = r.pipeline()
    await pipe.zremrangebyscore(key, 0, window_start)
    await pipe.zcard(key)
    await pipe.zadd(key, {str(now): now})
    await pipe.expire(key, 60)
    results = await pipe.execute()

    request_count = results[1]

    await r.aclose()

    if request_count >= REQUESTS_PER_MINUTE:
        return False, 0

    remaining = REQUESTS_PER_MINUTE - request_count - 1
    return True, remaining
