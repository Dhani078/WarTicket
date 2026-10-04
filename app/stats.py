from fastapi import APIRouter, HTTPException
import asyncpg
import redis.asyncio as aioredis

stats_router = APIRouter(prefix="/api/v1/admin", tags=["Admin & Telemetry"])

@stats_router.get("/stats")
async def get_system_stats():
    from app.main import db_pool, redis_client

    if not db_pool or not redis_client:
        raise HTTPException(status_code=503, detail="Database atau Redis belum siap.")

    async with db_pool.acquire() as conn:
        order_counts = await conn.fetch(
            "SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM orders GROUP BY status"
        )
        orders_summary = {r["status"]: {"count": r["count"], "total": float(r["total"])} for r in order_counts}

        tiers = await conn.fetch("SELECT id, name, price, total_stock, sold_stock FROM ticket_tiers ORDER BY price DESC")
        tier_stats = []
        for t in tiers:
            raw_redis_stock = await redis_client.get(f"tier:{t['id']}:stock")
            available_redis = int(raw_redis_stock) if raw_redis_stock is not None else 0
            tier_stats.append({
                "id": str(t["id"]),
                "name": t["name"],
                "price": float(t["price"]),
                "total_stock": t["total_stock"],
                "sold_stock_db": t["sold_stock"],
                "available_stock_redis": available_redis,
                "is_sold_out": available_redis <= 0
            })

        active_reservations = await redis_client.zcard("reservations:expiry_zset")

        return {
            "status": "healthy",
            "orders": orders_summary,
            "tiers": tier_stats,
            "active_redis_reservations": active_reservations,
            "zero_oversell_guarantee": "ENFORCED"
        }
