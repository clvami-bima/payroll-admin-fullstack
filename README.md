# Payroll Admin — Fullstack Project

Project referensi untuk role **Fullstack Developer (Mid-level)**: admin panel payroll dengan
backend **Node.js + Express + PostgreSQL** dan frontend **React + Tailwind CSS**.

## Fitur

- **Autentikasi**: login admin dengan JWT, role-based access (admin vs staff).
- **Manajemen Karyawan**: CRUD, pencarian, filter departemen/status, pagination.
- **Komponen Gaji**: tunjangan & potongan per karyawan, nominal tetap atau persentase dari gaji pokok.
- **Proses Payroll**: buat periode (bulan/tahun), jalankan payroll otomatis untuk semua karyawan aktif,
  hasil disimpan sebagai snapshot (tidak berubah walau data karyawan diedit setelahnya).
- **Slip Gaji Digital**: export slip gaji per karyawan ke PDF (pakai `pdfkit`).
- **Dashboard**: ringkasan karyawan aktif, total gaji periode terakhir, grafik karyawan per departemen (recharts).
- **Laporan**: tabel histori payroll dengan filter bulan/tahun/departemen + export CSV.

## Struktur Project

```
payroll-project/
├── backend/     # Node.js + Express + PostgreSQL REST API
└── frontend/    # React + Vite + Tailwind CSS
```

## Menjalankan Backend

```bash
cd backend
cp .env.example .env      # sesuaikan kredensial PostgreSQL & JWT_SECRET
npm install
npm run migrate           # buat tabel di database
npm run seed               # (opsional) isi data contoh - login: admin@company.com / admin123
npm run dev                 # jalankan di http://localhost:4000
```

Pastikan PostgreSQL sudah berjalan dan database (`PGDATABASE` di `.env`) sudah dibuat terlebih dahulu, contoh:
```bash
createdb payroll_db
```

## Menjalankan Frontend

```bash
cd frontend
cp .env.example .env      # sesuaikan VITE_API_URL jika backend tidak di localhost:4000
npm install
npm run dev                 # jalankan di http://localhost:5173
```

## Keamanan yang sudah diterapkan

- Password di-hash dengan `bcryptjs` (tidak pernah disimpan plaintext).
- Autentikasi JWT dengan expiry, disimpan sebagai Bearer token.
- Semua endpoint data karyawan/payroll wajib login (`requireAuth`); hapus data karyawan dibatasi role `admin`.
- Query database memakai parameterized query (`$1, $2, ...`) di semua tempat — **tidak ada string
  concatenation ke SQL**, jadi aman dari SQL injection.
- CORS dibatasi ke origin frontend yang dikonfigurasi, bukan wildcard `*`.
- Validasi input dasar di server (bukan hanya di klien) untuk field wajib dan nilai gaji.
- Pesan error login digeneralisasi ("Email atau password salah") agar tidak membocorkan apakah
  suatu email terdaftar.
- Tidak ada dependency yang mencurigakan — semua package berasal dari npm registry resmi dan populer
  (express, pg, jsonwebtoken, bcryptjs, pdfkit, react, dsb).

## Rencana Pengembangan Lanjutan (ide next steps)

- Tambah refresh token / logout server-side (blacklist token).
- Tambah audit log untuk setiap perubahan data gaji (siapa mengubah apa, kapan).
- Tambah rate limiting di endpoint login (mis. `express-rate-limit`).
- Tambah role staff dengan akses read-only ke laporan.
- Docker Compose untuk backend + PostgreSQL + frontend (nice-to-have dari JD).
