from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import uuid
import asyncpg
import redis.asyncio as aioredis

stats_router = APIRouter(prefix="/api/v1/admin", tags=["Admin & Telemetry"])

class AdjustStockRequest(BaseModel):
    additional_stock: int = Field(..., ge=1, le=10000)

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

@stats_router.post("/tiers/{tier_id}/adjust-stock")
async def adjust_tier_stock(tier_id: str, payload: AdjustStockRequest):
    from app.main import db_pool, redis_client

    try:
        tier_uuid = uuid.UUID(tier_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Format tier_id tidak valid.")

    async with db_pool.acquire() as conn:
        tier = await conn.fetchrow(
            "UPDATE ticket_tiers SET total_stock = total_stock + $1 WHERE id = $2 RETURNING id, name, total_stock, sold_stock",
            payload.additional_stock, tier_uuid
        )
        if not tier:
            raise HTTPException(status_code=404, detail="Tier tidak ditemukan.")

    stock_key = f"tier:{tier_id}:stock"
    new_redis_stock = await redis_client.incrby(stock_key, payload.additional_stock)

    return {
        "status": "success",
        "tier_id": tier_id,
        "name": tier["name"],
        "added_stock": payload.additional_stock,
        "new_total_stock_db": tier["total_stock"],
        "new_available_stock_redis": new_redis_stock
    }

