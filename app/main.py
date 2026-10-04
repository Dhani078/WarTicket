import json
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as aioredis

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL")
HOLDING_TTL = int(os.getenv("HOLDING_TTL_SECONDS", "600"))

db_pool: asyncpg.Pool = None
redis_client: aioredis.Redis = None
reserve_lua_sha: str = ""

LUA_SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "..", "scripts", "reserve_ticket.lua")
with open(LUA_SCRIPT_PATH, "r", encoding="utf-8") as f:
    LUA_RESERVE_CODE = f.read()

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool, redis_client, reserve_lua_sha
    db_pool = await asyncpg.create_pool(
        dsn=DATABASE_URL,
        min_size=5,
        max_size=20,
        ssl="require"
    )
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=False)
    reserve_lua_sha = await redis_client.script_load(LUA_RESERVE_CODE)

    async with db_pool.acquire() as conn:
        tiers = await conn.fetch("SELECT id, (total_stock - reserved_stock - sold_stock) as available FROM ticket_tiers")
        for tier in tiers:
            stock_key = f"tier:{tier['id']}:stock"
            exists = await redis_client.exists(stock_key)
            if not exists:
                await redis_client.set(stock_key, max(0, tier["available"]))

    yield

    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.aclose()

app = FastAPI(title="WarTiket High-Concurrency Engine", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReserveRequest(BaseModel):
    tier_id: str
    user_id: str
    quantity: int = Field(..., ge=1, le=2)

class CancelReservationRequest(BaseModel):
    reservation_token: str
    order_id: str

class WebhookPaymentRequest(BaseModel):
    idempotency_key: str
    order_id: str
    status: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "WarTiket Core", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/v1/events/active")
async def get_active_events():
    async with db_pool.acquire() as conn:
        event = await conn.fetchrow("SELECT * FROM events ORDER BY created_at DESC LIMIT 1")
        if not event:
            raise HTTPException(status_code=404, detail="Tidak ada event aktif")
        
        tiers = await conn.fetch("SELECT id, name, price, total_stock FROM ticket_tiers WHERE event_id = $1 ORDER BY price DESC", event["id"])
        tier_list = []
        for t in tiers:
            raw_stock = await redis_client.get(f"tier:{t['id']}:stock")
            available = int(raw_stock) if raw_stock is not None else 0
            tier_list.append({
                "id": str(t["id"]),
                "name": t["name"],
                "price": float(t["price"]),
                "available_stock": available,
                "is_sold_out": available <= 0
            })
            
        return {
            "id": str(event["id"]),
            "title": event["title"],
            "venue": event["venue"],
            "event_date": event["event_date"].isoformat(),
            "tiers": tier_list
        }

@app.post("/api/v1/tickets/reserve", status_code=status.HTTP_201_CREATED)
async def reserve_ticket(payload: ReserveRequest):
    try:
        tier_uuid = uuid.UUID(payload.tier_id)
        user_uuid = uuid.UUID(payload.user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Format tier_id atau user_id tidak valid (harus UUID).")

    stock_key = f"tier:{payload.tier_id}:stock"
    if not await redis_client.exists(stock_key):
        async with db_pool.acquire() as conn:
            stock_row = await conn.fetchrow(
                "SELECT (total_stock - reserved_stock - sold_stock) as available FROM ticket_tiers WHERE id = $1",
                tier_uuid
            )
            if stock_row:
                await redis_client.set(stock_key, max(0, stock_row["available"]))

    token = f"res_{uuid.uuid4().hex[:16]}"
    now_epoch = int(time.time())
    
    keys = [
        stock_key,
        f"user:{payload.user_id}:tier:{payload.tier_id}",
        f"reservation:{token}",
        "reservations:expiry_zset"
    ]
    args = [
        str(payload.quantity),
        token,
        payload.user_id,
        payload.tier_id,
        str(HOLDING_TTL),
        str(now_epoch)
    ]
    
    result = await redis_client.evalsha(reserve_lua_sha, len(keys), *keys, *args)
    
    if result == -1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tiket untuk kategori ini sudah habis.")
    if result == -2:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Anda masih memiliki antrean aktif untuk tiket ini.")
    
    try:
        async with db_pool.acquire() as conn:
            tier_info = await conn.fetchrow("SELECT price FROM ticket_tiers WHERE id = $1", tier_uuid)
            if not tier_info:
                raise HTTPException(status_code=404, detail="Tier tidak ditemukan.")
                
            total_amount = float(tier_info["price"]) * payload.quantity
            expires_at = datetime.fromtimestamp(now_epoch + HOLDING_TTL, tz=timezone.utc)
            order_id = uuid.uuid4()
            
            await conn.execute(
                """
                INSERT INTO orders (id, user_id, tier_id, quantity, total_amount, status, reservation_token, expires_at)
                VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7)
                """,
                order_id,
                user_uuid,
                tier_uuid,
                payload.quantity,
                total_amount,
                token,
                expires_at
            )
    except Exception as e:
        # Compensating rollback in Redis if PostgreSQL fails
        await redis_client.incrby(stock_key, payload.quantity)
        await redis_client.delete(f"user:{payload.user_id}:tier:{payload.tier_id}")
        await redis_client.delete(f"reservation:{token}")
        await redis_client.zrem("reservations:expiry_zset", token)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Database write failure, reservation rolled back.")

    return {
        "status": "success",
        "data": {
            "order_id": str(order_id),
            "reservation_token": token,
            "tier_id": payload.tier_id,
            "quantity": payload.quantity,
            "total_amount": total_amount,
            "holding_time_seconds": HOLDING_TTL,
            "expires_at": expires_at.isoformat()
        }
    }

@app.post("/api/v1/webhooks/payment")
async def payment_webhook(payload: WebhookPaymentRequest):
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            existing = await conn.fetchrow("SELECT idempotency_key FROM payment_idempotency WHERE idempotency_key = $1", payload.idempotency_key)
            if existing:
                return {"status": "ignored", "reason": "duplicate_event"}

            order = await conn.fetchrow("SELECT * FROM orders WHERE id = $1", uuid.UUID(payload.order_id))
            if not order:
                raise HTTPException(status_code=404, detail="Order tidak ditemukan")

            if order["status"] != "PENDING":
                return {"status": "ignored", "reason": f"order_already_{order['status'].lower()}"}

            if payload.status == "SUCCESS":
                await conn.execute("UPDATE orders SET status = 'PAID', updated_at = NOW() WHERE id = $1", order["id"])
                await conn.execute(
                    "UPDATE ticket_tiers SET sold_stock = sold_stock + $1 WHERE id = $2",
                    order["quantity"], order["tier_id"]
                )
                await redis_client.zrem("reservations:expiry_zset", order["reservation_token"])
                await redis_client.delete(f"reservation:{order['reservation_token']}")
                await redis_client.delete(f"user:{order['user_id']}:tier:{order['tier_id']}")
            elif payload.status in ("FAILED", "CANCELLED", "EXPIRED"):
                await conn.execute("UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1", order["id"])
                await redis_client.incrby(f"tier:{order['tier_id']}:stock", order["quantity"])
                await redis_client.zrem("reservations:expiry_zset", order["reservation_token"])
                await redis_client.delete(f"reservation:{order['reservation_token']}")
                await redis_client.delete(f"user:{order['user_id']}:tier:{order['tier_id']}")

            await conn.execute(
                "INSERT INTO payment_idempotency (idempotency_key, order_id, payload) VALUES ($1, $2, $3)",
                payload.idempotency_key, order["id"], json.dumps({"status": payload.status})
            )

    return {"status": "processed", "order_id": payload.order_id}

@app.post("/api/v1/tickets/cancel")
async def cancel_reservation(payload: CancelReservationRequest):
    async with db_pool.acquire() as conn:
        order = await conn.fetchrow(
            "SELECT * FROM orders WHERE id = $1 AND reservation_token = $2",
            uuid.UUID(payload.order_id), payload.reservation_token
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order tidak ditemukan.")
        if order["status"] != "PENDING":
            return {"status": "ignored", "reason": f"order_already_{order['status'].lower()}"}

        await conn.execute("UPDATE orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1", order["id"])

    tier_id = str(order["tier_id"])
    qty = order["quantity"]
    user_id = str(order["user_id"])

    await redis_client.incrby(f"tier:{tier_id}:stock", qty)
    await redis_client.delete(f"user:{user_id}:tier:{tier_id}")
    await redis_client.delete(f"reservation:{payload.reservation_token}")
    await redis_client.zrem("reservations:expiry_zset", payload.reservation_token)

    return {"status": "cancelled", "order_id": payload.order_id}

@app.get("/api/v1/orders/{order_id}")
async def get_order_detail(order_id: str):
    async with db_pool.acquire() as conn:
        order = await conn.fetchrow(
            """
            SELECT o.*, t.name as tier_name, e.title as event_title, e.venue as event_venue
            FROM orders o
            JOIN ticket_tiers t ON o.tier_id = t.id
            JOIN events e ON t.event_id = e.id
            WHERE o.id = $1
            """,
            uuid.UUID(order_id)
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order tidak ditemukan.")
        return {
            "id": str(order["id"]),
            "user_id": str(order["user_id"]),
            "tier_id": str(order["tier_id"]),
            "tier_name": order["tier_name"],
            "event_title": order["event_title"],
            "event_venue": order["event_venue"],
            "quantity": order["quantity"],
            "total_amount": float(order["total_amount"]),
            "status": order["status"],
            "reservation_token": order["reservation_token"],
            "expires_at": order["expires_at"].isoformat(),
            "created_at": order["created_at"].isoformat()
        }

