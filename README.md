# WarTiket — High-Concurrency Flash-Sale Ticketing Engine

WarTiket adalah sistem tiket konser skala tinggi (*high-concurrency flash-sale*) dengan garansi **Zero Overselling**, perlindungan idempotensi pembayaran, dan ketahanan transaksi terdistribusi penuh. Sistem memisahkan *hot-path reservation* ke memori menggunakan **Atomic Redis Lua Script** dan persistensi buku besar permanen ke **Neon PostgreSQL (PgBouncer connection pool)**.

---

## 🏛️ Arsitektur Sistem

```text
[ Browser / Mobile Client ]
             │
             ▼
   [ FastAPI REST API (Port 8000) ]
       │                         │
  (Hot Path: <15ms)        (Persistent Ledger)
       │                         │
       ▼                         ▼
[ Upstash Redis ]        [ Neon PostgreSQL (PgBouncer: 6543) ]
  ├── Lua Atomic Script    ├── events
  ├── tier:{id}:stock      ├── ticket_tiers
  ├── user:{id}:tier:{id}  ├── orders (PENDING / PAID / EXPIRED / CANCELLED)
  ├── ratelimit:ip:{ip}    └── payment_idempotency
  └── reservations:zset
       ▲
       │ (Auto-Reconcile Every 5s - 2-Phase Safe)
[ Background Worker (worker.py) ]
```

---

## ⚡ Garansi Zero Overselling & Keamanan Hot-Path

1. **Atomic Lua Script (`scripts/reserve_ticket.lua`):** Pengecekan stok, pengurangan stok (`DECRBY`), penguncian ganda antrean user, dan pendaftaran sorted set kedaluwarsa dieksekusi secara atomik di Redis dalam $<15\text{ ms}$.
2. **Anti-Bot Sliding-Window Limiter (`app/security.py`):** Pembatasan laju IP (150 req/10s) menggunakan sorted set Redis untuk menangkal serangan bot atau brute-force DDoS.
3. **Saga Compensating Rollback:** Jika koneksi Neon PostgreSQL gagal setelah reservasi di Redis berhasil, kuota Redis otomatis dikembalikan seketika (*zero stock leak*).
4. **Two-Phase Worker Reconciliation (`app/worker.py`):** Pengembalian kuota kedaluwarsa hanya dilakukan jika baris di PostgreSQL berstatus `PENDING` (`UPDATE 1`), mencegah celah *phantom stock* akibat persaingan dengan webhook pembayaran.
5. **Instant Cancellation (`POST /api/v1/tickets/cancel`):** Kuota tiket langsung dikembalikan ke publik saat pembeli membatalkan pesanan.

---

## 📂 Struktur Proyek

```text
WarTicket/
├── .env.example & .env
├── docker-compose.yml          # Container orchestration (Redis + API + Worker + Frontend)
├── Dockerfile.backend          # FastAPI + Reconciler Docker image
├── package.json                # NPM lifecycle & test orchestration
├── requirements.txt            # Python dependencies (FastAPI, asyncpg, redis-py)
├── README.md                   # Main documentation
├── ARCHITECTURE.md             # Deep distributed concurrency blueprint
├── API.md                      # REST API specification
├── TESTING.md                  # Test suites & benchmarking runbook
├── CHANGELOG.md                # Version & security audit log
├── database/
│   ├── schema.sql              # Neon PostgreSQL DDL
│   └── seed.sql                # Seed event & ticket tiers
├── scripts/
│   └── reserve_ticket.lua      # Atomic Lua hot-path engine
├── app/
│   ├── __init__.py
│   ├── main.py                 # REST API core (<290 lines)
│   ├── models.py               # Pydantic schemas (<20 lines)
│   ├── security.py             # IP sliding-window limiter (<40 lines)
│   ├── promos.py               # Promo & voucher engine (<40 lines)
│   ├── stats.py                # Admin observability & restock router (<80 lines)
│   └── worker.py               # Reconciler 2-phase transition (<70 lines)
├── frontend/
│   ├── Dockerfile.frontend & nginx.conf
│   ├── package.json & vite.config.ts
│   ├── index.html & src/index.css
│   ├── src/types.ts            # Frontend TypeScript definitions
│   ├── src/App.tsx             # State orchestrator & background poller (<298 lines)
│   ├── src/utils/sound.ts      # Zero-dependency Web Audio synthesizer (<60 lines)
│   ├── src/components/         # Modular UI components (<140 lines each)
│   │   ├── Header.tsx          # Sound toggle & order history
│   │   ├── HoldingBanner.tsx   # 600s countdown
│   │   ├── ErrorBanner.tsx     # Atomic alert notifications
│   │   ├── ArenaMap.tsx        # Interactive SVG Stage & Seating Map
│   │   ├── TierGrid.tsx        # Responsive ticket tiers grid
│   │   ├── QrisCard.tsx        # Dynamic Indonesian QRIS SVG
│   │   ├── VirtualAccountCard.tsx # BCA/Mandiri/BNI/BRI VA generator
│   │   ├── CreditCardCard.tsx  # 3-D Secure card input form
│   │   ├── VoucherInput.tsx    # Promo voucher validator
│   │   ├── OrderHistoryModal.tsx # Persistent order history drawer
│   │   ├── TelemetryModal.tsx  # Direct Edge live monitor modal
│   │   ├── PrintTicketModal.tsx # Printable concert pass modal
│   │   └── Footer.tsx
│   └── src/screens/            # Modular screen views (<285 lines each)
│       ├── CatalogScreen.tsx   # Catalog, search, filters & view toggle
│       ├── QueueModal.tsx      # Atomic radar queue scanner
│       ├── CheckoutScreen.tsx  # Checkout form, vouchers & payments
│       └── SuccessScreen.tsx   # Payment receipt & ticket print
├── references/
│   └── Leaked-System-Prompt-AI/ # Prompt architecture reference library
└── tests/
    ├── test_logic.py           # Unit tests logic
    ├── test_e2e_real.py        # 7-suite live Neon & Redis E2E tests
    ├── audit_viewports.py      # Automated CDP viewport auditor (0 overflow)
    ├── simulate_real_user.py   # Full user journey browser automation test
    ├── load_test_smoke.js      # k6 smoke benchmark (50 VUs)
    └── load_test_k6.js         # k6 flash-sale spike (3.000 VUs)
```

---

## 🚀 Panduan Eksekusi Sistem

### 1. Konfigurasi Lingkungan (`.env`)
```env
DATABASE_URL="postgresql://neondb_owner:***@ep-raspy-river-b3t9gzb6-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
REDIS_URL="redis://127.0.0.1:6379/0"
ENVIRONMENT="production"
PORT=8000
HOLDING_TTL_SECONDS=600
MAX_TICKETS_PER_USER=2
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"
```

### 2. Menjalankan Layanan (Terminal)
```bash
# Terminal 1: Backend API
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Background Reconciler Worker
python app/worker.py

# Terminal 3: Frontend Web
cd frontend && npm run dev
```

### 3. Pengujian Terpadu
```bash
# Menjalankan unit logic dan 7-suite live integration test:
npm test

# Menjalankan simulasi nyata alur pengguna di browser:
npm run test:simulate

# Menjalankan audit responsivitas layar (0 horizontal overflow):
npm run audit:viewport

# Menjalankan stress test konkurensi k6:
npm run test:smoke  # 50 VUs
npm run test:k6     # 3.000 VUs
```
