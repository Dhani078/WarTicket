import asyncio
import os
import time
import asyncpg
from dotenv import load_dotenv
import redis.asyncio as aioredis

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")

async def start_reconciliation():
    pool = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=2, max_size=5, ssl="require")
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    print("[Reconciler] Service Active: Listening for expired reservations...")

    while True:
        try:
            now = int(time.time())
            expired_tokens = await r.zrangebyscore("reservations:expiry_zset", 0, now)

            for token in expired_tokens:
                res_key = f"reservation:{token}"
                res_data = await r.hgetall(res_key)
                
                tier_id = res_data.get("tier_id") if res_data else None
                qty = int(res_data.get("quantity", 0)) if res_data else 0
                user_id = res_data.get("user_id") if res_data else None

                async with pool.acquire() as conn:
                    # Fallback to DB if Redis evicted the hash key early
                    if not tier_id or qty == 0:
                        order = await conn.fetchrow(
                            "SELECT tier_id, quantity, user_id FROM orders WHERE reservation_token = $1 AND status = 'PENDING'",
                            token
                        )
                        if order:
                            tier_id = str(order["tier_id"])
                            qty = order["quantity"]
                            user_id = str(order["user_id"])

                    if tier_id and qty > 0:
                        await r.incrby(f"tier:{tier_id}:stock", qty)
                    if user_id and tier_id:
                        await r.delete(f"user:{user_id}:tier:{tier_id}")
                    await r.delete(res_key)
                    await r.zrem("reservations:expiry_zset", token)

                    await conn.execute(
                        "UPDATE orders SET status = 'EXPIRED', updated_at = NOW() WHERE reservation_token = $1 AND status = 'PENDING'",
                        token
                    )
                print(f"[Reconciler] Auto-refunded expired reservation: {token}")

        except Exception as e:
            print(f"[Reconciler Error] {e}")
            await asyncio.sleep(2)

        await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(start_reconciliation())
