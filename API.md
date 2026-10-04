# WarTiket — REST API Specification

Dokumentasi lengkap REST API WarTiket Core Engine. Base URL default: `http://localhost:8000`.

---

## 1. Health & Telemetry

### `GET /health`
Cek kesiapan dan status operasional backend.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "WarTiket Core",
  "timestamp": "2026-10-04T05:54:41.667600+00:00"
}
```

### `GET /api/v1/admin/stats`
Melihat ringkasan telemetri, breakdown status order, dan integritas stok real-time.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "orders": {
    "PAID": { "count": 5, "total": 12450000.0 },
    "PENDING": { "count": 2, "total": 5000000.0 },
    "CANCELLED": { "count": 3, "total": 3960000.0 }
  },
  "tiers": [
    {
      "id": "b1000000-0000-0000-0000-000000000001",
      "name": "VIP Lounge",
      "price": 2500000.0,
      "total_stock": 75,
      "sold_stock_db": 5,
      "available_stock_redis": 70,
      "is_sold_out": false
    }
  ],
  "active_redis_reservations": 2,
  "zero_oversell_guarantee": "ENFORCED"
}
```

---

## 2. Event & Ticket Catalog

### `GET /api/v1/events/active`
Mengambil detail festival aktif dan kuota stok tiket real-time dari memori Redis.
- **Response `200 OK`:**
```json
{
  "id": "a0000000-0000-0000-0000-000000000001",
  "title": "Neon Horizon Festival 2026: Liburland Stage",
  "venue": "Aurora Arena, Jakarta",
  "event_date": "2026-11-14T13:00:00+00:00",
  "tiers": [
    {
      "id": "b1000000-0000-0000-0000-000000000001",
      "name": "VIP Lounge",
      "price": 2500000.0,
      "available_stock": 70,
      "is_sold_out": false
    }
  ]
}
```

---

## 3. Ticket Reservations & Orders

### `POST /api/v1/tickets/reserve`
Mengamankan kuota tiket secara eksklusif via Redis Lua Script.
- **Request Body:**
```json
{
  "tier_id": "b1000000-0000-0000-0000-000000000001",
  "user_id": "00000000-0000-4000-8000-000000000001",
  "quantity": 2
}
```
- **Response `201 Created`:**
```json
{
  "status": "success",
  "data": {
    "order_id": "acb87602-c599-4b7d-b05f-94e25456cfc3",
    "reservation_token": "res_89fa12b842cd18a9",
    "tier_id": "b1000000-0000-0000-0000-000000000001",
    "quantity": 2,
    "total_amount": 5000000.0,
    "holding_time_seconds": 600,
    "expires_at": "2026-10-04T07:16:38+00:00"
  }
}
```
- **Error Codes:**
  - `409 Conflict`: Tiket habis (*Sold Out*).
  - `429 Too Many Requests`: User masih memiliki antrean aktif untuk tier ini, atau batas IP rate limit terlampaui.
  - `422 Unprocessable Entity`: Format ID bukan UUID valid atau quantity > 2.

### `POST /api/v1/tickets/cancel`
Membatalkan reservasi tiket secara instan dan mengembalikan kuota ke Redis.
- **Request Body:**
```json
{
  "reservation_token": "res_89fa12b842cd18a9",
  "order_id": "acb87602-c599-4b7d-b05f-94e25456cfc3"
}
```
- **Response `200 OK`:**
```json
{
  "status": "cancelled",
  "order_id": "acb87602-c599-4b7d-b05f-94e25456cfc3"
}
```

### `GET /api/v1/orders/{order_id}`
Mengambil data detail pemesanan tiket dari Neon PostgreSQL.
- **Response `200 OK`:**
```json
{
  "id": "acb87602-c599-4b7d-b05f-94e25456cfc3",
  "tier_name": "VIP Lounge",
  "event_title": "Neon Horizon Festival 2026",
  "quantity": 2,
  "total_amount": 5000000.0,
  "status": "PAID",
  "reservation_token": "res_89fa12b842cd18a9"
}
```

---

## 4. Payment Gateway Webhook

### `POST /api/v1/webhooks/payment`
Webhook penerima notifikasi pembayaran terproteksi idempotensi.
- **Request Body:**
```json
{
  "idempotency_key": "pay_res_89fa12b842cd18a9",
  "order_id": "acb87602-c599-4b7d-b05f-94e25456cfc3",
  "status": "SUCCESS"
}
```
- **Response `200 OK` (Processed):** `{"status": "processed", "order_id": "..."}`
- **Response `200 OK` (Duplicate):** `{"status": "ignored", "reason": "duplicate_event"}`

---

## 5. Promo & Voucher Engine

### `POST /api/v1/promos/validate`
Validasi kode voucher diskon.
- **Request Body:** `{"code": "WAR50K", "subtotal": 1980000}`
- **Response `200 OK`:**
```json
{
  "valid": true,
  "code": "WAR50K",
  "discount_amount": 50000.0,
  "description": "Potongan Langsung Rp 50.000 Flash-Sale",
  "final_subtotal": 1930000.0
}
```

---

## 6. Admin Inventory Replenishment

### `POST /api/v1/admin/tiers/{tier_id}/adjust-stock`
Menambah kuota tiket live ke PostgreSQL dan Redis secara atomik.
- **Request Body:** `{"additional_stock": 25}`
- **Response `200 OK`:**
```json
{
  "status": "success",
  "tier_id": "b1000000-0000-0000-0000-000000000001",
  "name": "VIP Lounge",
  "added_stock": 25,
  "new_total_stock_db": 75,
  "new_available_stock_redis": 70
}
```
