# RLS dan Integrasi Database ProofyLink

## Keputusan Produk

- Kandidat dapat self-register.
- Recruiter disimpan sebagai `pending` sampai trusted provisioning/admin approval selesai.
- Hanya candidate profile `is_published = true` yang dapat ditemukan recruiter.
- Data private dan screening result membutuhkan consent yang valid.
- Fase awal memakai server-only Drizzle dengan validasi Supabase Auth pada setiap route.
- RLS tetap aktif sebagai perlindungan Data API; fase hardening berikutnya dapat memakai non-bypass role/request JWT context.
- Token disimpan dalam ledger/account balance dan screening memakai transaksi idempotent.
- UI baru dan perubahan UI menggunakan Bahasa Indonesia.

## Fase 1: Model dan Invariant

1. Tambahkan status provisioning recruiter (`pending`, `active`, `rejected`) dan cegah client memilih role recruiter aktif.
2. Tambahkan account balance/token ledger untuk screening.
3. Pastikan `users.auth_user_id` menjadi mapping tunggal ke Supabase Auth.
4. Tambahkan index untuk kolom foreign key yang dipakai policy dan query authorization.
5. Pastikan organisasi, membership, candidate profile, consent item, dan screening run memiliki hubungan yang konsisten.

## Fase 2: Identity dan RLS

1. Buat helper private untuk current app user, organization membership, recruiter capability, candidate ownership, consent access, dan conversation participant.
2. Aktifkan RLS pada seluruh tabel public.
3. Candidate hanya dapat mengakses profile dan section miliknya.
4. Recruiter hanya dapat mengakses data organisasi yang memiliki membership aktif.
5. Published profile tetap tidak membuka data private atau screening result.
6. Candidate hanya dapat merespons consent item miliknya.
7. Notifications hanya dapat dibaca pemiliknya.
8. Conversation dan messages hanya dapat dibaca participant aktif.
9. Consent event, notification, screening score, dan token ledger memiliki trusted-write policy.
10. Jangan menggunakan mutable `user_metadata` sebagai sumber authorization.

## Fase 3: Database Read Model

1. Tambahkan `GET /api/app/bootstrap` untuk identity, organization, profile, shortlist, consent, notification, token, dan screening summary.
2. Tambahkan read API untuk profile, shortlist, consent request, notifications, dan screening.
3. Normalisasi enum database ke status UI.
4. Database mode tidak lagi membaca atau menulis application state ke localStorage.
5. LocalStorage tetap dipakai hanya oleh explicit demo adapter.

## Fase 4: Shortlist dan Consent

1. Sambungkan shortlist selection ke UUID candidate profile database.
2. Persist shortlist item dan recruiter notes melalui API.
3. Kirim satu batch consent request untuk banyak kandidat.
4. Candidate dapat melihat recruiter name, company, email, purpose, expiry, dan request history.
5. Approval gabungan tetap menyimpan keputusan per item dan audit event.
6. Tambahkan validasi expiry, duplicate active request, candidate eligibility, dan organization scope.

## Fase 5: Screening dan Token

1. Tambahkan endpoint transactional untuk memulai screening.
2. Validasi candidate consent, expiry, organization, requester, dan request item.
3. Deduct satu token dengan idempotency key.
4. Persist `screening_runs` dengan lifecycle pending, in-progress, completed, failed.
5. Persist `screening_scores` setelah AI provider berhasil.
6. Client tidak boleh mengotorisasi screening hanya dengan `consent: true`.

## Fase 6: Conversation dan Notification

1. Buat conversation setelah consent approved.
2. Persist participant dan messages.
3. Batasi read/write berdasarkan participant.
4. Buat durable notification untuk consent, screening, dan messages.
5. Gunakan Realtime sebagai delivery layer setelah durable read/write stabil.
6. Tentukan read-only atau blocked saat consent dicabut.

## Fase 7: Verification

- `npm run db:check`
- `npm run db:migrate`
- Supabase security advisor
- Supabase performance advisor
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Playwright dengan context recruiter dan candidate terpisah.
- Uji cross-user, cross-organization, expired consent, duplicate screening, double token charge, dan demo fallback.
