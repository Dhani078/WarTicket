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

## 3. Two-Phase Worker State Transition (Phantom Stock Elimination)

Pada sistem terdistribusi, background worker yang membersihkan reservasi kedaluwarsa berpotensi konflik dengan webhook pembayaran yang tiba pada milidetik yang sama:
- **Pola Lama (Rawan Bug):** Worker me-refund stok Redis terlebih dahulu baru memperbarui DB. Jika order di DB sudah dibayar, stok di Redis bertambah tanpa ada tiket yang dikembalikan (*phantom stock*).
- **Pola Baru (Two-Phase Enforced):**
  1. Worker mengeksekusi `UPDATE orders SET status = 'EXPIRED' WHERE reservation_token = $1 AND status = 'PENDING'` terlebih dahulu.
  2. Hanya jika respons DB menghasilkan `'UPDATE 1'`, worker mengeksekusi `INCRBY tier:{id}:stock {quantity}`.
  3. Jika respons DB adalah `'UPDATE 0'` (artinya pesanan sudah `PAID` atau `CANCELLED`), worker sama sekali tidak menambah stok Redis.

---

## 4. Pola Kompensasi Terdistribusi (*Saga Compensating Action*)

Pada skenario jaringan terdistribusi di mana Redis berhasil mengamankan kuota namun PostgreSQL gagal menulis baris pesanan (misalnya timeout pool atau kegagalan koneksi jaringan):
- Blok `try...except` di FastAPI memicu *compensating action*:
  - `INCRBY tier:{id}:stock {quantity}`
  - Menghapus kunci reservasi `reservation:{token}` dan kunci antrean user `user:{user_id}:tier:{tier_id}`.
- Menjamin stok di memori Redis tidak bocor (*zero stock leak*).

---

## 5. Pertahanan Bot & Sliding-Window IP Rate Limiting

Untuk mencegah scraper atau bot membanjiri jalur reservasi:
- `app/security.py` menerapkan *Sliding Window Rate Limiter* via Redis Sorted Set.
- Kunci `ratelimit:ip:{ip}` menyimpan timestamp milidetik setiap request.
- Permintaan lama di luar window 10 detik dibersihkan dengan `ZREMRANGEBYSCORE`.
- Jika jumlah elemen (`ZCARD`) melebihi 150 request dalam 10 detik, request dipotong dengan `HTTP 429 Too Many Requests`.

---

## 6. Live Inventory Replenishment & Stock Integrity Invariant

Sistem menjamin keabsahan invarian stok global:
$$\text{sold\_stock}_{\text{db}} + \text{active\_reservations}_{\text{redis}} + \text{available\_stock}_{\text{redis}} = \text{total\_stock}_{\text{db}}$$

Setiap penambahan kuota melalui endpoint admin (`POST /api/v1/admin/tiers/{id}/adjust-stock`) memperbarui `total_stock` di PostgreSQL dan `tier:{id}:stock` di Redis secara sinkron sehingga katalog selalu konsisten di semua instans.
