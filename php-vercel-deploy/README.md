# SIP-PKKM 2026 — MIS Almaarif 06 Toyomarto (PHP Native PDO + MySQL + Tailwind CSS)

Aplikasi Ceklist Bukti Fisik & Progres Visitasi PKKM Level 4 Tahun 2026 (89 Butir Indikator, 4 Komponen) siap deploy di **Vercel** melalui **GitHub**.

## Fitur Utama
- **Menu Terpisah Per Komponen**: Komponen 1 (25 butir), Komponen 2 (41 butir), Komponen 3 (12 butir), dan Komponen 4 (11 butir).
- **Ceklist Bukti Fisik Level 4 & Lokasi Berkas**: Centang rincian dokumen per indikator, atur status (`Belum Disetor`, `Dalam Proses`, `Sudah Disetorkan`), serta catat nomor ordner/map atau tautan Google Drive.
- **Pelaksana / PIC Per Komponen**: Menampilkan orang yang mengerjakan setiap indikator berdasarkan dokumen visitasi.
- **Notifikasi Progres Otomatis**: Setiap update dari anggota tim otomatis mengirimkan notifikasi ke PIC terkait, Kepala Madrasah, dan Administrator.
- **Ekspor CSV**: Unduh rekap ceklist lengkap untuk verifikasi pengawas pembina.

## Struktur Folder
- `vercel.json` — Konfigurasi runtime `vercel-php@0.7.3`
- `config/database.php` — Koneksi PHP Native PDO MySQL (mendukung SSL Cloud MySQL)
- `database/schema.sql` — Struktur tabel MySQL
- `database/seed.sql` — Data lengkap 4 komponen, 89 indikator, semua rincian bukti fisik, dan 12 PIC
- `api/index.php` & `api/helpers.php` — Front controller & logika notifikasi relevan
- `views/` — Tampilan antarmuka Tailwind CSS

## Langkah Deploy ke GitHub & Vercel

### 1. Siapkan Database MySQL Cloud
Gunakan layanan MySQL gratis/cloud seperti **TiDB Cloud**, **Aiven for MySQL**, **Railway**, atau **Hostinger Remote MySQL**.
Jalankan SQL secara berurutan:
1. `database/schema.sql`
2. `database/seed.sql`

### 2. Upload ke GitHub
```bash
git init
git add .
git commit -m "Initial commit SIP-PKKM 2026 MI Almaarif 06 Toyomarto"
git branch -M main
git remote add origin https://github.com/USERNAME/sip-pkkm-almaarif06.git
git push -u origin main
```

### 3. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com) → **Add New Project** → pilih repository GitHub Anda.
2. Pada bagian **Environment Variables**, tambahkan:
   - `DB_HOST`
   - `DB_PORT` (biasanya `3306` atau `4000` untuk TiDB)
   - `DB_NAME` (`pkkm_almaarif06`)
   - `DB_USER`
   - `DB_PASS`
3. Klik **Deploy**. Vercel akan membaca `vercel.json` dan menjalankan aplikasi PHP Native PDO secara otomatis.

---
*Developer By Administrator MI Almaarif 06 Toyomarto*
