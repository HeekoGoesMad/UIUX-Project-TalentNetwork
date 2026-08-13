# Migrasi Supabase Auth dan Database ProofyLink

## Tujuan

Memindahkan identitas dan data utama ProofyLink dari state demo `localStorage` ke Supabase Auth dan PostgreSQL, tanpa kehilangan alur consent-first screening, shortlist, notifikasi, percakapan, dan skor kandidat.

## Keputusan Teknologi

- Database: PostgreSQL melalui Supabase Free untuk fase pengembangan.
- ORM: Drizzle ORM dan Drizzle Kit.
- Auth: Supabase Auth email/password pada fase database pertama.
- File: Supabase Storage untuk CV dan dokumen profil.
- Realtime: Supabase Realtime sebagai delivery layer; database tetap menjadi sumber kebenaran.
- Validasi: Zod pada route handler dan server action.
- ID aplikasi: UUID yang dibuat database atau aplikasi, kecuali ID yang diwajibkan Supabase Auth.
- Bahasa UI: Bahasa Indonesia untuk seluruh copy UI baru dan perubahan UI.

## Fase 1: Fondasi dan Auth

1. Tambahkan konfigurasi Supabase browser/server dan validasi environment variable.
2. Tambahkan Drizzle schema, konfigurasi migration, dan koneksi server-only.
3. Buat tabel user, organisasi, profil recruiter, profil kandidat, dan status onboarding.
4. Migrasikan login, register, logout, dan route protection dari demo `localStorage` ke Supabase Auth.
5. Simpan nama registrasi dan role pada profil aplikasi; jangan gunakan nama demo hardcoded.
6. Pertahankan redirect `next` setelah autentikasi.
7. Jalankan `drizzle-kit generate` dan `drizzle-kit migrate`; jangan gunakan `drizzle push`.

## Fase 2: Onboarding Talent

1. Setelah registrasi kandidat, arahkan ke `/candidate/onboarding`.
2. Gunakan wizard box-based tanpa scroll dokumen.
3. Simpan draft setiap langkah agar onboarding dapat dilanjutkan.
4. Kumpulkan nama, status karier, headline, target role, lokasi, pengalaman, pendidikan, skill, tools, preferensi kerja, dan ringkasan.
5. Gunakan taxonomy lokasi, skill, dan tools dengan alias untuk menyamakan input berbeda tanpa bergantung pada API eksternal.
6. Sediakan review, profile completeness, dan aksi publish profile.
7. Arahkan kandidat ke `/candidate` setelah onboarding selesai.

## Fase 3: Shortlist dan Batch Consent

1. Ubah shortlist menjadi relasi `shortlists` dan `shortlist_items`.
2. Tambahkan pilihan kandidat pada halaman shortlist.
3. Tampilkan kategori `Consent belum diminta`, `Consent diminta`, `Disetujui`, `Ditolak`, dan `Screening selesai`.
4. Izinkan recruiter memilih banyak kandidat dan mengirim satu batch consent request.
5. Simpan item consent per kandidat untuk audit dan status individual.
6. Tampilkan nama recruiter, nama perusahaan, dan email recruiter pada request kandidat.
7. Gunakan satu approval gabungan di UI, tetapi simpan hasil per item di database.

## Fase 4: Screening dan Skor

1. Pisahkan consent dari `screening_runs`.
2. Terapkan lifecycle pending, approved, in-progress, completed, dan failed.
3. Potong satu screening token per kandidat hanya saat screening dimulai.
4. Simpan score, label, coverage, evidence, limitations, model version, source, dan waktu hasil.
5. Tambahkan halaman recruiter untuk melihat dan membandingkan skor kandidat.
6. Pertahankan batasan AI: tidak ada keputusan otomatis hire/reject dan tidak menganalisis data finansial, kredit, atau atribut sensitif.

## Fase 5: Notifikasi dan Percakapan

1. Persist notification sebagai data database dengan status read/unread.
2. Buat notifikasi ketika consent diminta, disetujui, ditolak, screening selesai, atau pesan baru masuk.
3. Buat conversation setelah candidate menyetujui request gabungan.
4. Persist conversation participant dan message.
5. Gunakan Realtime sebagai tambahan, bukan pengganti data durable.
6. Jika consent dicabut, pertahankan riwayat percakapan dan terapkan status read-only atau blocked.

## Keamanan

- Semua tabel memiliki owner atau participant yang jelas.
- Candidate hanya dapat membaca dan merespons request miliknya.
- Recruiter hanya dapat mengakses shortlist dan screening organisasi sendiri.
- Conversation hanya dapat dibaca participant.
- Screening hanya dapat dijalankan setelah consent yang valid.
- Profil dan dokumen mengikuti scope consent.
- Tambahkan Row-Level Security policy sebelum data dibuka melalui client Supabase.

## Verifikasi

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Playwright: register candidate, onboarding, recruiter shortlist, batch consent, candidate approval, notification, screening, score, dan conversation.
- Verifikasi dua atau lebih kandidat dalam satu request tidak saling berbagi status, score, atau consent.
