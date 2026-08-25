# ProofyLink Talent Network — Panduan Arsitektur & Alur

Dokumen ini menjelaskan apa yang dilakukan layanan ini, bagaimana data mengalir, dan di mana setiap bagian berada di dalam kodebase. Diagram menggunakan [Mermaid](https://mermaid.js.org/) dan dirender langsung di GitHub.

> **Catatan pratinjau lokal:** GitHub merender Mermaid secara bawaan. Jika Anda memakai VS Code, pasang ekstensi **"Markdown Preview Mermaid Support"** agar diagram tampil di preview.

---

## 1. Apa yang dilakukan layanan ini?

ProofyLink menghubungkan **kandidat** dan **recruiter** melalui pipeline screening yang berbasis persetujuan (consent-first):

- **Kandidat** membangun profil terstruktur (impor CV, skill, pengalaman), mempublikasikannya, dan mengontrol siapa yang boleh men-screening mereka melalui **permintaan consent** yang eksplisit.
- **Recruiter** mencari talenta yang sudah dipublikasikan, memakai **token** untuk membuka profil lengkap, mengirim permintaan consent, menjalankan **screening risiko/kredibilitas berbasis AI**, melakukan shortlist, dan mengirim pesan.
- Setiap screening menghasilkan **skor** yang dapat diaudit (coverage, evidence, limitations) yang tersimpan di database — bukan sekadar jawaban AI tanpa jejak.

Prinsip intinya: **tidak ada screening tanpa consent kandidat, tidak ada aksi tanpa jejak token.**

---

## 2. Arsitektur Sistem

```mermaid
flowchart LR
    subgraph Client["Browser (React 19)"]
        UI["Halaman App Router<br/>candidate / recruiter / search / talent"]
        AP["AppProvider<br/>(state klien, toast, optimistic update)"]
    end

    subgraph NextServer["Server Next.js 16"]
        API["API Route Handlers<br/>src/app/api/*"]
        SVC["Lapisan Service<br/>src/lib/services/*"]
        AI["AI Provider<br/>src/lib/ai/provider"]
    end

    subgraph Supabase["Supabase"]
        AUTH["Supabase Auth<br/>(email/password)"]
        PG[("PostgreSQL<br/>Drizzle ORM")]
    end

    AZURE["Azure OpenAI<br/>(gpt-4o)"]

    UI --> AP
    AP -->|"fetch /api/*"| API
    API --> SVC
    SVC --> PG
    SVC --> AI
    AI --> AZURE
    AI -.->|"AI_PROVIDER=mock<br/>atau gagal"| MOCK["Respons mock tervalidasi Zod"]
    AUTH <--> PG
```

**Aturan utama:** semua akses database melewati lapisan service (`src/lib/services/`) — halaman tidak pernah query Drizzle secara langsung. Setiap service memiliki satu domain:

| Service | Domain |
| :--- | :--- |
| `TalentSearchService` | Pencarian talenta level database, filter, paginasi |
| `ProfileService` | Persistensi profil & section kandidat |
| `ShortlistService` | Shortlist + item (termasuk provisioning shortlist default) |
| `ConsentService` | Batch consent, item, event, kedaluwarsa |
| `ScreeningService` | Cek consent → pemotongan token → run AI → penyimpanan skor |
| `MessagingService` | Percakapan, partisipan, pesan (menghindari N+1) |
| `TokenLedgerService` | Saldo token + entri ledger append-only |

---

## 3. Operasi Dual-Mode

Aplikasi berjalan dalam dua mode bergantung pada keberadaan env var Supabase:

```mermaid
flowchart TD
    START["Aplikasi dimuat"] --> Q{"NEXT_PUBLIC_SUPABASE_URL<br/>+ anon key tersedia?"}
    Q -- "Ya" --> DB["Mode Database<br/>Auth sungguhan, persistensi Postgres,<br/>consent, token, messaging"]
    Q -- "Tidak" --> DEMO["Mode Demo (fallback lokal)<br/>State in-memory di AppProvider,<br/>kandidat demo hasil seed, AI mock"]
```

- **Mode database**: registrasi melakukan provisioning user → organization/member → token account; profil tersinkron ke `profiles` + `candidate_profile_sections`; setiap mutasi melewati `/api/*`.
- **Mode demo**: `src/lib/demo-seed.ts` menyediakan data agar produk tetap bisa diklik penuh untuk review desain tanpa backend apa pun.
- ID recruiter berbentuk UUID diarahkan ke alur database; ID non-UUID (seed demo) tetap lokal — lihat `UUID_RE` di `src/lib/utils.ts`.

---

## 4. Perjalanan Pengguna

### Perjalanan kandidat

```mermaid
flowchart TD
    REG["Registrasi sebagai kandidat"] --> ONB["Wizard onboarding<br/>/candidate/onboarding"]
    ONB --> CV["Bangun profil<br/>Impor PDF CV (ekstraksi AI)<br/>atau manual lewat CV builder /candidate/cv"]
    CV --> PUB["Publikasikan profil<br/>(isPublished = true)"]
    PUB --> WAIT["Menunggu ditemukan"]
    WAIT --> REQ["Menerima permintaan consent<br/>/candidate/contact-requests"]
    REQ --> DEC{"Setujui?"}
    DEC -- "Setuju" --> OK["Recruiter boleh men-screening Anda<br/>(sampai consent kedaluwarsa)"]
    DEC -- "Tolak" --> NO["Recruiter tidak dapat screening"]
    OK --> MSG["Chat dengan recruiter /messages"]
```

### Perjalanan recruiter

```mermaid
flowchart TD
    SIGNUP["Registrasi perusahaan"] --> PEND["Provisioning<br/>/recruiter/pending"]
    PEND --> ACTIVE{"Aktif?"}
    ACTIVE -- "Ya" --> SRCH["Cari talenta /search<br/>(filter + paginasi server-side)"]
    SRCH --> CARD{"Buka profil lengkap?"}
    CARD -- "Scan" --> TOK["Potong 1 token<br/>(profil terbuka)"]
    CARD -- "Preview" --> FREE["Preview gratis terbatas (maks 5)"]
    TOK --> PROF["Profil talenta /talent/[candidateId]"]
    PROF --> CONS["Ajukan consent<br/>(batch, purpose + expiry)"]
    CONS --> GOT{"Kandidat menyetujui?"}
    GOT -- "Ya" --> RUN["Jalankan screening AI<br/>(1 token, skor berbasis evidence)"]
    GOT -- "Tidak / kedaluwarsa" --> BLOCK["Screening diblokir (403)"]
    RUN --> SL["Shortlist + catatan /shortlist"]
    SL --> CHAT["Kirim pesan ke kandidat /messages"]
```

---

## 5. Alur Inti: Screening Bergerbang Consent

Ini adalah jantung produk — bagaimana recruiter berpindah dari *menemukan kandidat* menjadi *memiliki laporan screening*:

```mermaid
sequenceDiagram
    actor R as Recruiter
    participant App as API Next.js
    participant CS as ConsentService
    participant C as Kandidat
    participant SS as ScreeningService
    participant TL as TokenLedgerService
    participant AI as Azure OpenAI

    R->>App: POST /api/consent-requests (batch kandidat)
    App->>CS: createBatch(purpose, expiresAt)
    CS-->>C: notifikasi + item pending
    C->>CS: approve / decline / revoke
    Note over CS: perubahan status tercatat di consent_events

    R->>SS: startRun(candidateId, consentItemId)
    SS->>CS: verifikasi item = approved DAN belum kedaluwarsa?
    alt consent tidak valid
        SS-->>R: 403 "Consent belum disetujui atau kedaluwarsa"
    else consent valid
        SS->>TL: potong 1 token (idempotencyKey)
        SS->>AI: screening(section profil)
        AI-->>SS: score { coverage, evidence[], limitations[], label }
        SS->>SS: simpan screening_runs + screening_scores
        SS-->>R: run selesai beserta skor
    end
```

Status consent (`src/types/index.ts`):

```
not-requested → pending-candidate-consent → consented ─→ withdrawn
                                          ├→ declined
                                          └→ consent-expired
consented → screening-in-progress → screening-completed → disputed
```

Sebuah batch bisa membawa `expiresAt` sendiri; consent yang kedaluwarsa gagal di jalur 403 yang sama dengan consent yang ditolak.

---

## 6. Ekonomi Token

Token bersifat per-organisasi dan berbasis ledger:

```mermaid
flowchart LR
    GRANT["Pemberian / top-up token"] --> ACC[("token_accounts<br/>(saldo)")]
    ACC --> LEDGER[("token_ledger_entries<br/>(audit log append-only)")]
    LEDGER -->|"-1 scan"| SCAN["Buka profil kandidat"]
    LEDGER -->|"-1 screening run"| SCREEN["Screening risiko AI"]
    SCREEN -.-> SCORE["screening_scores (audit)"]
```

- Saldo hidup di `token_accounts`; **setiap** perubahan menulis baris `token_ledger_entries` (source, amount, idempotency key).
- Idempotency key membuat retry aman — mengulang grant atau screening tidak pernah memotong ganda.
- Route top-up khusus dev: `POST /api/dev/token-grant` (butuh `DEV_TOKEN_GRANT_ENABLED=true` + mode development).
- Preview gratis: recruiter dapat melihat sejumlah profil terbatas (5) sebelum wajib scan/screening.

---

## 7. Model Data (disederhanakan)

```mermaid
erDiagram
    users ||--o{ organization_members : "anggota dari"
    organizations ||--o{ organization_members : "memiliki"
    users ||--|| profiles : "baris profil"
    profiles ||--o{ candidate_profiles : "detail kandidat"
    candidate_profiles ||--o{ candidate_profile_sections : "experience/education/skills"
    organizations ||--|| token_accounts : "satu saldo"
    token_accounts ||--o{ token_ledger_entries : "audit"
    organizations ||--o{ shortlists : "pemilik"
    shortlists ||--o{ shortlist_items : "berisi"
    organizations ||--o{ consent_request_batches : "pengaju"
    consent_request_batches ||--o{ consent_request_items : "per kandidat"
    consent_request_batches ||--o{ consent_events : "audit"
    candidate_profiles ||--o{ consent_request_items : "target"
    consent_request_items ||--o{ screening_runs : "bergerbang consent"
    screening_runs ||--|| screening_scores : "menghasilkan"
    conversations ||--o{ conversation_participants : "partisipan"
    conversation_participants }o--|| users : "milik user"
    conversations ||--o{ messages : "berisi pesan"
    users ||--o{ notifications : "menerima"
```

Skema lengkap: `src/db/schema.ts`. Migrations dikomit — generate dengan `npm run db:generate`, apply dengan `npm run db:migrate`, jangan pernah `drizzle push`.

---

## 8. Lapisan AI

`src/lib/ai/provider.ts` membungkus Vercel AI SDK:

- Provider dipilih lewat `AI_PROVIDER` (`azure` | `mock`).
- Azure OpenAI (`gpt-4o`) dipakai untuk:
  - **Ekstraksi PDF CV** → draft profil terstruktur (`POST /api/cv/import`)
  - **Run screening** → skor coverage, daftar evidence, limitations, label risiko
  - **Saran career advisor / roadmap** di sisi kandidat
- Semua output AI diparse melalui **skema Zod**; jika provider `mock`, kredensial hilang, atau panggilan gagal, respons mock terstruktur dikembalikan — sehingga tidak ada alur UI yang keras kepala bergantung pada LLM yang selalu hidup.

---

## 9. Di Mana Segala Sesuatu Berada

| Path | Fungsi |
| :--- | :--- |
| `src/app/(pages)` | Route: `candidate/`, `recruiter/`, `search/`, `talent/[candidateId]/`, `shortlist/`, `messages/`, `partner/` |
| `src/app/api/` | Route handlers: `candidates/`, `consent-requests/`, `screening-runs/`, `shortlists/`, `tokens/`, `messages/`, `conversations/`, `cv/`, `profile/`, `notifications/`, `dev/` |
| `src/lib/services/` | Satu class per domain (lihat tabel di §2) |
| `src/lib/ai/` | Abstraksi provider + skema Zod |
| `src/providers/app-provider.tsx` | Store sisi klien: sesi, toast, shortlist/catatan optimistis, fallback demo |
| `src/db/` | Skema Drizzle + client |
| `scripts/tests/` | Script E2E lintas-akun (`npm run test:e2e`) |

---

*Ada pertanyaan tentang alur tertentu? Cek class service-nya lebih dulu — di sanalah sumber kebenaran aturan bisnis.*
