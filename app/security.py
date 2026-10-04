import time
from fastapi import Request, HTTPException, status
import redis.asyncio as aioredis

# Redis sliding window rate limiter: max_requests per window_seconds
async def rate_limit_ip(
    request: Request,
    redis_client: aioredis.Redis,
    max_requests: int = 30,
    window_seconds: int = 10
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    key = f"ratelimit:ip:{client_ip}"

    pipeline = redis_client.pipeline()
    # Remove scores older than window
    pipeline.zremrangebyscore(key, 0, now - window_seconds)
    # Count requests in window
    pipeline.zcard(key)
    # Add current timestamp
    pipeline.zadd(key, {str(now): now})
    # Set expiration on sorted set
    pipeline.expire(key, window_seconds + 5)
    
    results = await pipeline.execute()
    current_count = results[1]

    if current_count >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak permintaan dari IP Anda. Batas {max_requests} req / {window_seconds}s.",
            headers={"Retry-After": str(window_seconds)}
        )
