# WarTiket — Architectural Blueprint & Concurrency Specifications

## 1. Zero Overselling Design Guarantee

Dalam skenario *flash sale* tiket konser dengan ribuan transaksi per detik (*RPS*), database relasional tradisional (*PostgreSQL*) rentan mengalami kegagalan akibat *row lock contention* atau *deadlocks* jika pembaruan kolom stok dilakukan langsung pada tabel (`UPDATE ticket_tiers SET stock = stock - 1`).

WarTiket menerapkan isolasi mutlak antara **Hot-Path Reservation** dan **Ledger Persistence**:

```text
[Incoming High-Concurrency Requests: 3,000+ VUs]
                        │
                        ▼
      [Atomic In-Memory Lua Execution in Redis]
      ├── 1. EVALSHA reserve_ticket.lua
      ├── 2. GET current stock (atomic)
      ├── 3. IF stock < qty -> RETURN -1 (REJECTED IMMEDIATELY, NO DB HIT)
      ├── 4. IF user_locked -> RETURN -2 (RATE-LIMITED, NO DB HIT)
      ├── 5. DECRBY stock
      ├── 6. HSET reservation:{token} (LOCKED, TTL: 600s)
      ├── 7. SET user lock (EX: 600s)
      └── 8. ZADD expiry_zset (epoch + 600) -> RETURN 1 (ACCEPTED)
                        │
                        ▼
         [PostgreSQL Async Ledger Insertion]
         └── INSERT INTO orders (...) VALUES ('PENDING')
```

### Karakteristik Performa
- **Latensi Hot-Path:** Operasi Lua Redis tuntas dalam $< 15\text{ ms}$.
- **Beban Database Terproteksi:** Database PostgreSQL hanya menerima `INSERT` pesanan untuk permintaan yang telah sah mengantongi kuota, bukan ribuan kueri gagal.

---

## 2. Idempotensi Pembayaran (*Payment Webhook Idempotency*)

Endpoint webhook pembayaran (`POST /api/v1/webhooks/payment`) dilindungi oleh tabel `payment_idempotency` dan transaksi atomik:
1. Pengecekan `idempotency_key`. Jika kunci sudah tercatat, webhook langsung merespon `{"status": "ignored", "reason": "duplicate_event"}` tanpa memicu mutasi ganda.
2. Status pesanan diverifikasi. Hanya pesanan berstatus `PENDING` yang diproses ke status `PAID`.
3. Pada transaksi sukses:
   - Kolom `orders.status` diperbarui menjadi `PAID`.
   - Kolom `ticket_tiers.sold_stock` ditambah sesuai kuantitas.
   - Kunci reservasi di Redis (`reservations:expiry_zset`, `reservation:{token}`, `user:{user_id}:tier:{tier_id}`) langsung dibersihkan.
   - Baris dicatat pada `payment_idempotency`.

---

## 3. Rekonsiliasi Otomatis (*Deterministic Expiry Reconciliation*)

Siklus pengembalian kuota yang kedaluwarsa dijamin oleh `app/worker.py`:
- Setiap 5 detik, worker memindai `reservations:expiry_zset` dengan skor `0` sampai `NOW()`.
- Setiap token yang melewati batas 600 detik diproses:
  - Mengembalikan stok ke Redis via `INCRBY tier:{id}:stock {quantity}`.
  - Menghapus penguncian antrean user.
  - Memperbarui status baris pesanan PostgreSQL menjadi `EXPIRED`.
- Menjamin tidak ada kuota yang tertahan atau hilang jika pembeli membatalkan atau tidak menyelesaikan transaksi.
- Dilengkapi fallback otomatis ke PostgreSQL jika memori Redis mengalami pengosongan (*eviction*).

---

## 4. Pola Kompensasi Terdistribusi (*Saga Compensating Action*)

Pada skenario jaringan terdistribusi di mana Redis berhasil mengamankan kuota namun PostgreSQL gagal menulis baris pesanan (misalnya timeout pool atau kegagalan koneksi jaringan):
- Blok `try...except` di FastAPI memicu *compensating action*:
  - `INCRBY tier:{id}:stock {quantity}`
  - Menghapus kunci reservasi dan antrean user.
- Menjamin stok di memori Redis tidak bocor (*zero stock leak*).

