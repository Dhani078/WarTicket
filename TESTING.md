# WarTiket — Comprehensive Testing & Quality Assurance Runbook

Panduan lengkap suite pengujian otomatis, benchmark beban tinggi (k6), integrasi database nyata, dan audit antarmuka (CDP).

---

## 1. Menjalankan Seluruh Pengujian Inti (`npm test`)

Perintah ini mengeksekusi dua suite pengujian penting secara berurutan:
```bash
npm test
```
1. **Unit Logic Suite (`tests/test_logic.py`):**
   - Validasi batas kuantitas Pydantic (1 <= qty <= 2).
   - Verifikasi integritas sintaks skrip Lua Redis (`DECRBY`, `HSET`, `ZADD`, `EXISTS`).
   - Format token reservasi `res_{uuid16}` dan kepatuhan TTL 600 detik.
2. **7-Suite Live E2E Integration Suite (`tests/test_e2e_real.py`):**
   - Tes 1: Koneksi Neon PostgreSQL & pembacaan kuota awal.
   - Tes 2: Pre-flight validator UUID (HTTP 422).
   - Tes 3: Reservasi tiket riil via Lua & DB insertion (HTTP 201).
   - Tes 4: Penguncian antrean ganda user yang sama (HTTP 429).
   - Tes 5: Pembatalan instan & verifikasi stok kembali 100% utuh.
   - Tes 6: Webhook pembayaran idempoten (`processed` vs `ignored`).
   - Tes 7: Verifikasi status `PAID` permanen di Neon PostgreSQL.

---

## 2. Simulasi Alur Pengguna Penuh di Browser (`npm run test:simulate`)

Menggerakkan browser headless Chromium/Edge via Chrome DevTools Protocol (CDP) untuk meniru aksi nyata pembeli dari awal hingga akhir:
```bash
npm run test:simulate
```
Alur yang diuji secara otomatis:
- Memuat katalog festival.
- Mengaktifkan tampilan **Peta Arena SVG** dan memilih zona panggung langsung dari grafis.
- Mengatur kuantitas 2 tiket.
- Mengunci kuota dan melalui modal radar antrean atomik.
- Menerapkan voucher diskon `WAR50K` (-Rp 50.000).
- Memilih metode QRIS dan membayar pesanan.
- Memverifikasi e-tiket resmi di modal pass dan persistensi order di *Order History* localStorage.

---

## 3. Audit Responsivitas Layar 0 Horizontal Overflow (`npm run audit:viewport`)

Menguji kepatuhan responsivitas CSS Tailwind di 5 breakpoint layar berbeda:
```bash
npm run audit:viewport
```
Kriteria kelulusan: `doc.scrollWidth === win.innerWidth` (0px horizontal overflow).
- Mobile Small (iPhone SE): `375 x 667`
- Mobile Standard (iPhone 14 / Android): `390 x 844`
- Tablet (iPad Mini): `768 x 1024`
- Desktop High-DPI: `1440 x 900`
- Desktop 1080p: `1920 x 1080`

---

## 4. Pengujian Beban Konkurensi k6 (Zero Oversell Proof)

Menguji ketahanan backend dan Redis saat diserang ribuan Virtual Users (VUs) secara simultan:

### A. Smoke Test (50 VUs)
```bash
npm run test:smoke
```

### B. Flash-Sale Spike Stress Test (3.000 VUs)
```bash
npm run test:k6
```
Metrik kelulusan:
- **Zero Server Fault:** `status !== 500` adalah 100%.
- **Valid Flash-Sale Status:** Hanya menghasilkan `201 Created` (kuota didapat), `409 Conflict` (tiket habis), atau `429 Too Many Requests` (antrean ganda/rate limit).
- **Zero Oversell Guarantee:** Jumlah tiket terjual + tiket sisa di Redis sama persis dengan total kuota di database Neon.
