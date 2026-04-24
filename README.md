# Kelontong Manager

Aplikasi manajemen toko kelontong sederhana berbasis Next.js App Router, TypeScript, Tailwind CSS, dan Prisma + SQLite.

## Fitur utama

- Login `admin` dan `kasir`
- Manajemen produk: tambah, edit, hapus
- Transaksi penjualan dengan cart dan stok otomatis berkurang
- Rekap penjualan harian dan laporan transaksi
- Dashboard ringkas, tabel interaktif, dan responsive UI

## Setup lokal

1. Install dependensi:

```bash
npm install
```

2. Buat database dan seeding data dummy:

```bash
npm run setup
```

3. Mulai development server:

```bash
npm run dev
```

4. Buka aplikasi:

```bash
http://localhost:3000
```

## Akun demo

- Admin: `admin` / `admin123`
- Kasir: `user` / `user123`

## Deploy ke Vercel

1. Pastikan semua file sudah tersimpan.
2. Deploy ke Vercel dengan repository ini.
3. Jalankan `npm install` dan `npm run setup` di local sebelum build jika ingin melihat data dummy.

## Struktur utama

- `app/` - halaman App Router
- `components/` - UI reusable dan auth
- `lib/prisma.ts` - client Prisma
- `prisma/` - schema SQLite dan seed data
