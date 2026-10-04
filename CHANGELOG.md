# WarTiket — Engineering Changelog

Catatan riwayat pembaruan, penguatan arsitektur, dan audit sistem WarTiket.

---

## [v1.4.0] — 2026-10-04
### Added
- **Interactive SVG Arena Map (`ArenaMap.tsx`):** Denah panggung festival (Main Stage, Laser Grid, VIP Lounge, GA Floor, FOH Sound Booth) yang dapat diklik langsung untuk memilih tier tiket.
- **View Mode Switcher:** Opsi tombol toggle `[Grid]` dan `[Peta Arena]` pada `CatalogScreen.tsx`.
- **IP Sliding-Window Rate Limiter (`security.py`):** Perlindungan DDoS dan scraper berbasis sorted set Redis (`ratelimit:ip:{ip}`).
- **Automated Viewport Auditor (`audit_viewports.py`):** Pengujian headless browser CDP membuktikan 0 horizontal overflow di 5 breakpoint layar (375px sampai 1920px).
- **Full User Journey Simulator (`simulate_real_user.py`):** Skrip automasi browser yang menguji seluruh transaksi dari katalog, pemilihan peta arena, voucher diskon, hingga receipt e-tiket.

### Refactored
- Pemecahan model Pydantic ke berkas modular `app/models.py`.
- Penataan `TierGrid.tsx` untuk menjaga ukuran seluruh berkas di bawah 300 baris.

---

## [v1.3.0] — 2026-10-04
### Added
- **Promo & Voucher Engine (`promos.py` & `VoucherInput.tsx`):** Validasi voucher `WAR50K`, `LIBURLAND`, dan `FREEFEE` dengan kalkulasi diskon otomatis pada checkout.
- **Live Inventory Replenishment (`stats.py`):** Endpoint admin untuk menambah stok tiket secara live ke PostgreSQL dan Redis secara sinkron.
- **Web Audio Tactile Feedback (`sound.ts`):** Sintesis audio murni Web Audio API browser (chime saat reservasi & melodi saat pembayaran sukses) dengan tombol mute di header.
- **Order History Drawer (`OrderHistoryModal.tsx`):** Penyimpanan riwayat pesanan di `localStorage` per browser sehingga pembeli dapat mencetak e-tiket kapan saja.

### Fixed
- **Two-Phase Worker Race Condition:** Background reconciler kini memutasi status pesanan di PostgreSQL ke `EXPIRED` terlebih dahulu, dan hanya mengembalikan kuota ke Redis jika menghasilkan `'UPDATE 1'`, meniadakan celah *phantom stock*.

---

## [v1.2.0] — 2026-10-03
### Added
- **Real Database Integration:** Terhubung langsung ke cluster **Neon PostgreSQL Cloud** (`withered-leaf-49522281`) via PgBouncer port 6543 dengan SSL.
- **Local Redis Engine v8.10:** Integrasi server Redis lokal untuk mengeksekusi skrip Lua atomik.
- **Saga Pattern Compensating Rollback:** Rollback otomatis di Redis jika PostgreSQL gagal menulis baris order.
- **Instant Cancellation Endpoint (`POST /api/v1/tickets/cancel`):** Pengembalian stok instan ke Redis saat pembeli membatalkan pesanan.
- **Order Detail Query (`GET /api/v1/orders/{order_id}`):** Kueri riwayat pesanan dengan relasi join tier dan event.
- **Indonesian QRIS SVG Card (`QrisCard.tsx`):** Render kartu QRIS SVG dinamis standar nasional.
- **Printable E-Ticket Pass Modal (`PrintTicketModal.tsx`):** Dialog pass resmi konser dengan barcode/QR pass dan trigger cetak PDF.
- **Live Telemetry Modal (`TelemetryModal.tsx`):** Pemantau latensi edge, kuota aktif, dan invarian integritas stok.

---

## [v1.1.0] — 2026-10-03
### Refactored
- Modularisasi penuh antarmuka frontend React + Tailwind v4:
  - `Header.tsx`, `HoldingBanner.tsx`, `ErrorBanner.tsx`, `Footer.tsx`
  - `CatalogScreen.tsx`, `QueueModal.tsx`, `CheckoutScreen.tsx`, `SuccessScreen.tsx`
  - Memastikan seluruh berkas tetap berukuran di bawah 300 baris.

---

## [v1.0.0] — 2026-10-03
### Initial Architecture
- Inisialisasi mesin WarTiket: skrip atomik Redis Lua (`scripts/reserve_ticket.lua`), DDL PostgreSQL (`schema.sql`), dan FastAPI backend core.
- Garansi Zero Overselling dengan isolasi hot-path di memori Redis.
