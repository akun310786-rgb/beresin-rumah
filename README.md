# Beresin Rumah

Aplikasi pemesanan jasa home cleaning (Next.js 15 + Supabase).

## Fitur
- Landing page & form pemesanan (tersimpan ke Supabase).
- Dashboard admin: kelola pesanan, status, pembayaran, penugasan pekerja.
- Portal pekerja: checklist sebelum/sesudah pekerjaan.
- Autentikasi via nomor telepon + kata sandi (Supabase Auth).

## Setup

1. Install Node.js LTS dan pnpm.
2. Salin env:
   ```bash
   cp .env.local.example .env.local
   # isi NEXT_PUBLIC_SUPABASE_ANON_KEY dan NEXT_PUBLIC_WHATSAPP_NUMBER
   ```
3. Install deps:
   ```bash
   pnpm install
   ```
4. Jalankan migrasi Supabase (folder `supabase/migrations/`) ke project Anda.
5. Buat user admin/pekerja di Supabase Auth (phone + password), lalu set role di tabel `profiles`.
6. Dev:
   ```bash
   pnpm dev
   ```

## Struktur
- `src/app` — halaman & route handlers.
- `src/lib/supabase` — client/server Supabase.
- `supabase/migrations` — skema & RLS.
- `legacy/` — versi statis lama (arsip).
- `docs/assets/` — aset desain.

## Catatan keamanan
- RLS aktif di semua tabel; `has_role()` SECURITY DEFINER.
- Pekerja hanya dapat mengubah checklist (kolom sensitif dilindungi trigger).
- Harga diambil dari `service_packages` (bukan hardcode di route).
