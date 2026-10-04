# WarTiket — High-Concurrency Flash-Sale Ticketing Engine

WarTiket adalah sistem tiket konser skala tinggi (*high-concurrency flash-sale*) dengan garansi **Zero Overselling** dan perlindungan transaksi idempotency penuh. Arsitektur memisahkan *hot-path reservation* ke memori menggunakan **Atomic Redis Lua Script** dan persistensi buku besar ke **Neon PostgreSQL** dengan connection pooling PgBouncer.

---

## 🏛️ Arsitektur Sistem

```text
[ Browser / Mobile Client ]
             │
             ▼
   [ FastAPI REST API (Port 8000) ]
       │                         │
  (Hot Path: <25ms)        (Persistent Ledger)
       │                         │
       ▼                         ▼
[ Upstash Redis ]        [ Neon PostgreSQL (PgBouncer: 6543) ]
  ├── Lua Atomic Script    ├── events
  ├── tier:{id}:stock      ├── ticket_tiers
  ├── user:{id}:tier:{id}  ├── orders (PENDING / PAID / EXPIRED)
  └── reservations:zset    └── payment_idempotency
       ▲
       │ (Auto-Reconcile Every 5s)
[ Background Worker (worker.py) ]
```

---

## ⚡ Garansi Zero Overselling (Redis Lua Script)

Operasi pengecekan kuota, pemotongan stok, dan penguncian antrean user dijalankan dalam satu siklus atomik via skrip Lua di memori Redis (`scripts/reserve_ticket.lua`):
1. **Stock Check & Decrement:** Memeriksa `tier:{id}:stock`. Jika stok kurang dari permintaan, skrip langsung mengembalikan kode `-1` (Sold Out). Stok dikurangi dengan `DECRBY`.
2. **User Lock:** Memeriksa `user:{user_id}:tier:{tier_id}`. Jika user sudah memiliki antrean aktif pada tier tersebut, skrip mengembalikan `-2` (Rate limit / Lock aktif) untuk mencegah penimbunan tiket.
3. **Reservation Hash:** Data reservasi disimpan di `reservation:{token}` dengan status `LOCKED` dan TTL 600 detik (10 menit).
4. **Sorted Set Expiry:** Token dan timestamp kedaluwarsa dicatat di sorted set `reservations:expiry_zset` untuk pemantauan latar belakang.

---

## 🔄 Background Reconciliation Worker (`app/worker.py`)

Worker berjalan secara asinkron setiap 5 detik untuk mendeteksi reservasi yang kedaluwarsa (`expires_at < NOW()`):
- Mengambil token kedaluwarsa dari `reservations:expiry_zset`.
- Membaca data reservasi dari `reservation:{token}` (dengan fallback otomatis ke tabel `orders` PostgreSQL jika Redis mengevikasi kunci lebih awal).
- Mengembalikan kuota tiket ke Redis via `INCRBY tier:{tier_id}:stock {quantity}`.
- Menghapus kunci antrean user `user:{user_id}:tier:{tier_id}`.
- Memperbarui status pesanan di PostgreSQL dari `PENDING` menjadi `EXPIRED`.

---

## 🛡️ Distributed Resilience & Endpoints Tambahan

1. **Compensating Rollback (Saga Pattern):** Jika penulisan baris order ke PostgreSQL gagal setelah eksekusi Lua Redis berhasil, server API otomatis mengeksekusi rollback di Redis (`INCRBY` stok kembali dan hapus kunci user), menjamin tidak ada kuota yang bocor (*zero stock leak*).
2. **Instant Cancellation (`POST /api/v1/tickets/cancel`):** Pembeli yang membatalkan pesanan di halaman checkout langsung melepaskan kuota kembali ke pool seketika tanpa harus menunggu timeout 10 menit.
3. **Order Detail Query (`GET /api/v1/orders/{order_id}`):** Endpoint verifikasi status dan riwayat order langsung ke PostgreSQL.
4. **Live Stock Polling:** Frontend memperbarui katalog tiket secara halus setiap 4 detik saat berada di katalog.

---

## 📂 Struktur Proyek

```text
WarTicket/
├── .env.example
├── .env
├── neon.ts
├── package.json
├── requirements.txt
├── README.md
├── ARCHITECTURE.md
├── database/
│   ├── schema.sql
│   └── seed.sql
├── scripts/
│   └── reserve_ticket.lua
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── worker.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── types.ts            # Type definitions (Tier, EventData, Attendee, Step)
│   │   ├── App.tsx             # Main orchestrator (<250 lines)
│   │   ├── components/         # Modular UI components (<65 lines each)
│   │   │   ├── Header.tsx
│   │   │   ├── HoldingBanner.tsx
│   │   │   ├── ErrorBanner.tsx
│   │   │   ├── QrisCard.tsx
│   │   │   └── Footer.tsx
│   │   └── screens/            # Screen views (<280 lines each)
│   │       ├── CatalogScreen.tsx
│   │       ├── QueueModal.tsx
│   │       ├── CheckoutScreen.tsx
│   │       └── SuccessScreen.tsx
│   └── dist/
└── tests/
    ├── test_logic.py
    ├── test_e2e_real.py
    └── load_test_k6.js
```

---

## 🚀 Panduan Menjalankan Sistem

### 1. Konfigurasi Lingkungan (`.env`)
Sistem telah terhubung langsung ke cluster **Neon PostgreSQL Production** (`withered-leaf-49522281`) dan server Redis:
```env
DATABASE_URL="postgresql://neondb_owner:***@ep-raspy-river-b3t9gzb6-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
REDIS_URL="redis://127.0.0.1:6379/0"
ENVIRONMENT="production"
PORT=8000
HOLDING_TTL_SECONDS=600
MAX_TICKETS_PER_USER=2
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"
```

### 2. Setup Database PostgreSQL
Jalankan skrip migrasi DDL dan data awal pada query editor Neon:
- `database/schema.sql` (Tabel `events`, `ticket_tiers`, `orders`, `payment_idempotency`)
- `database/seed.sql` (Event *Neon Horizon Festival 2026* dan 3 tier tiket)

### 3. Backend REST API (Terminal 1)
```bash
# Aktifkan virtual environment
./venv/Scripts/activate

# Jalankan server FastAPI
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Background Reconciliation Worker (Terminal 2)
```bash
./venv/Scripts/python app/worker.py
```

### 5. Frontend React + Tailwind (Terminal 3)
```bash
cd frontend
npm install
npm run dev
```
Akses antarmuka di `http://localhost:5173`.

---

## 🧪 Stress Test k6 (3.000 Concurrent VUs)
Jalankan pengujian beban lonjakan (*flash-sale spike*) untuk memverifikasi ketahanan sistem:
```bash
k6 run tests/load_test_k6.js
```
Kriteria keberhasilan uji beban:
- Respon reservasi hanya berupa `201 Created` (berhasil mengamankan kuota) atau `409 Conflict` (tiket habis).
- **0% Server Fault (HTTP 500)**.
- Stok akhir di Redis dan PostgreSQL konsisten sempurna.
