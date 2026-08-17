# Isolasi Mock Data dan Supabase Mode

## Tujuan

Memastikan Supabase/database mode tidak pernah menampilkan atau menyimpan data mock secara diam-diam, sambil mempertahankan demo lokal hanya ketika `NEXT_PUBLIC_DEV_AUTH_BYPASS=true` atau Supabase tidak dikonfigurasi.

## Aturan Mode

- `database mode`: Supabase Auth aktif, bootstrap dan mutations memakai API/PostgreSQL, mock fallback dilarang.
- `demo mode`: localStorage dan fixture data boleh digunakan.
- Database error pada database mode harus tampil sebagai error/empty state, bukan berubah menjadi demo data.

## Prioritas Implementasi

1. `/messages` menggunakan conversation dan messages database; database mode tidak menginisialisasi pesan Nadia mock.
2. `conversationId` menjadi parameter canonical untuk navigasi message.
3. Candidate directory database menggunakan UUID; static `candidate-1` hanya untuk demo mode.
4. Screening page tidak boleh kembali ke kandidat fixture saat UUID database tidak ditemukan.
5. Profile dan CV database mode tidak boleh menampilkan fallback Nadia.
6. Shortlist notes, candidate metadata, consent, dan screening links memakai data remote.
7. Scan/unlock token dan career status membedakan adapter database versus demo.
8. Tambahkan empty/error/loading states berbahasa Indonesia.

## Verifikasi

- Database mode tanpa conversation menampilkan empty state, bukan pesan mock.
- Pesan tersimpan setelah refresh.
- Consent approved dapat membuat/membuka conversation.
- Candidate UUID tidak berubah menjadi `candidate-1`.
- Screening memakai candidate profile UUID yang benar.
- Candidate database baru tidak melihat profile Nadia.
- Shortlist notes tetap ada setelah refresh.
- Demo bypass tetap dapat memakai fixture dan localStorage.
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
