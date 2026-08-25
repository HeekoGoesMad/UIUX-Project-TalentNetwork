<div align="center">

# 🛡️ ProofyLink Talent Network
### **AI-Powered Talent Intelligence & HR Risk Screening Platform**

*Empowering recruiters to make faster, objective hiring decisions while helping candidates build credible, data-backed career paths.*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-7.0-black?style=for-the-badge&logo=vercel&logoColor=white)](https://sdk.vercel.ai/)
[![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-Integrated-0089D6?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/)

[Key Features](#-key-features) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Getting Started](#-getting-started) • [Environment Variables](#-environment-variables) • [Project Structure](#-project-structure)

---
</div>

## 📌 Overview

**ProofyLink Talent Network** transforms pre-hire candidate screening and talent discovery. Moving beyond conventional resumes, ProofyLink provides data-backed credibility assessments, risk screening, and AI-driven candidate matching to eliminate bad hiring costs and bridge the gap between job seekers and employers.

---

## ✨ Key Features

### 🏢 For Recruiters & HR Managers
* **🎯 Candidate Discovery & Search:** Smart multi-attribute filtering by skill, role, location, and verified signals with candidate match percentage.
* **🛡️ Risk & Credibility Assessment:** Pre-interview screening highlighting skill evidence, coverage scores, and potential hiring risks without bias.
* **🤖 AI Candidate Summaries & Interview Generator:** Instant AI-synthesized profile overviews and tailored, evidence-based interview question drafts.
* **📋 Shortlisting & Pipeline Management:** Bookmark top candidates, manage candidate lists, and initiate direct, context-rich conversations.

### 👤 For Candidates & Job Seekers
* **✨ AI Career Advisor:** Interactive career guidance providing actionable step-by-step roadmaps to reach target roles.
* **📄 AI CV Builder & Importer:** Extract key achievements from existing CVs or build optimized resumes tailored to market demand.
* **📊 Profile Coverage & Signal Verification:** Showcase verified achievements, certifications, and project outcomes.
* **💼 Relevant Job Discovery:** Discover aligned opportunities and connect directly with hiring managers.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 16 (App Router)](https://nextjs.org) with React 19
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com) with `@tailwindcss/postcss` & CSS variables
* **UI Components:** [Radix UI](https://www.radix-ui.com/), Custom Design System (Plus Jakarta Sans + JetBrains Mono, Sonner Toasts, Lucide Icons)
* **AI & Machine Learning:** [Vercel AI SDK](https://sdk.vercel.ai/) integrated with [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) (`gpt-4o`) with automatic fallback to structured mock responses
* **Validation & Types:** [Zod](https://zod.dev/), [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 20.0.0
* npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HeekoGoesMad/UIUX-Project-TalentNetwork.git
   cd UIUX-Project-TalentNetwork
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Copy `.env` or create `.env.local` in the project root (see [Environment Variables](#-environment-variables)).

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file from `.env.example` with the keys below.

| Variable | Scope | Visibility | When Needed |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | Public (inlined into client bundle) | Always — Supabase auth & client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build + Runtime | Public (inlined into client bundle) | Always — Supabase auth & client |
| `DATABASE_URL` | Runtime | Private (server-only) | Drizzle migrations, DB queries, `/api/health`; pooled Supabase Postgres connection string |
| `DEV_AUTH_BYPASS` | Runtime | Private (server-only) | Dev only — bypasses email verification/token charges; hard-fails in production |
| `NEXT_PUBLIC_DEMO_MODE` | Build + Runtime | Public (client demo affordances) | Dev only — free talent scans, instant demo registrations |
| `DEV_TOKEN_GRANT_ENABLED` | Runtime | Private (server-only) | Dev only — enables `POST /api/dev/token-grant` |
| `AI_PROVIDER` | Runtime | Private (server-only) | `mock` \| `local` \| `azure` (default: azure); falls back to mock data if unset |
| `LOCAL_AI_BASE_URL` / `LOCAL_AI_MODEL` / `LOCAL_AI_API_KEY` | Runtime | Private (server-only) | Only when `AI_PROVIDER=local` (Ollama / LM Studio / OpenAI-compatible server) |
| `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_DEPLOYMENT` / `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_API_VERSION` | Runtime | Private (server-only) | Only when `AI_PROVIDER=azure` |
| `E2E_RECRUITER_EMAIL` / `E2E_RECRUITER_PASSWORD` | Local e2e only | Private | Running `npm run test:e2e` locally — never set in deployed environments |
| `E2E_CANDIDATE_EMAIL` / `E2E_CANDIDATE_PASSWORD` | Local e2e only | Private | Running `npm run test:e2e` locally — never set in deployed environments |
| `E2E_BASE_URL` | Local e2e only | Private | Target for e2e runs (defaults to `http://localhost:3000`) |

> **Note:** If `AI_PROVIDER` is set to `mock` or credentials are missing, the system gracefully falls back to structured mock data powered by Zod schemas. The production build requires no env secrets (guards fail closed).

---

## ▲ Deployment (Vercel)

Deployment is push-to-deploy via Vercel:

1. Import the repository into Vercel (framework auto-detected as Next.js).
2. Configure environment variables in **Project Settings → Environment Variables** (see table above).
3. Every branch/PR gets an automatic **preview deployment**; merging to the production branch triggers a **production deployment**.
4. CI (`.github/workflows/ci.yml`) runs lint, typecheck, and build on every push and PR — builds require no env secrets.

---

## 🗄️ Database and Authentication

The first database phase uses Supabase Auth and PostgreSQL with Drizzle ORM.

1. Create a Supabase project and enable email/password authentication.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the pooled `DATABASE_URL`.
3. Generate migrations with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate`.
5. Validate the schema with `npm run db:check`.

Never use `drizzle-kit push` or `drizzle push`. Keep generated migrations committed. The application can still run in local demo fallback mode when Supabase variables are absent, but real registration, persistent profiles, and database consent requests require Supabase configuration.

### Admin bootstrap & recruiter approvals

There is no self-service admin signup. Promote the first admin directly in the database (Supabase SQL editor or `psql`):

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Admin-only API (session cookie auth; caller must have `users.role = 'admin'`, otherwise `403`):

- `GET /api/admin/recruiters` — lists all recruiters with their profile and provisioning status.
- `PATCH /api/admin/recruiters/{userId}` — approves or rejects a recruiter (`{"action": "approve" | "reject", "reason": "..."}`; reason required for reject), optionally upserting organization membership via `organizationId`/`organizationRole`.

Approval flips `users.recruiter_provisioning_status` to `active` (or `rejected`); every action is recorded in the `audit_logs` table (`admin.recruiter.approve` / `admin.recruiter.reject`, plus `organization.member.updated` when membership changes).

### Production configuration hardening

Production validates configuration through the internal `GET /api/health/config` endpoint. Send the `x-healthcheck-token` header matching the server-only `HEALTHCHECK_TOKEN`; the response contains readiness flags only and never returns credential values. A missing or invalid production configuration returns a safe list of required variable names, not secrets.

The feature flags are `BILLING_ENABLED`, `DOCUMENT_STORAGE_ENABLED`, and `EMAIL_DELIVERY_ENABLED`. Billing and document storage default to enabled, while email delivery defaults to disabled. In production, enabled billing requires a non-mock `PAYMENT_PROVIDER` and `PAYMENT_WEBHOOK_SECRET`, enabled document storage requires `SUPABASE_CV_BUCKET`, and enabled email delivery requires `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME`. The application sends notification email through Brevo's transactional email API. `DEV_AUTH_BYPASS`, `NEXT_PUBLIC_DEMO_MODE`, and `DEV_TOKEN_GRANT_ENABLED` must never be true in production. `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are always required in production.

Supabase Auth email delivery is separate from application notification email. Configure Supabase Auth SMTP in the Supabase dashboard; the Brevo variables above are not used for Supabase Auth SMTP.

Local development remains usable with the defaults in `.env.example`: mock AI, demo auth fallback, mock billing, in-memory/demo document behavior, and no email delivery. Real Supabase Auth, database persistence, payments, storage, and email delivery still require their external services and credentials.

The repository intentionally does not add a static `/* /index.html 200` fallback. The deployment target must provide its supported Next.js App Router runtime for middleware, API routes, and dynamic routes.

---

## 📁 Project Structure

```
├── docs/                    # Business requirements, proposals & technical specs
│   ├── business/            # Business models & partnership proposals
│   └── specs/               # Candidate profile & modal specifications
├── scripts/                 # Maintenance, migration & test scripts
│   └── tests/               # E2E cross-account test scripts
├── src/
│   ├── app/                 # Next.js App Router (pages & API routes)
│   │   ├── candidate/       # Candidate portal & career tools
│   │   ├── recruiter/       # Recruiter dashboard & risk screening
│   │   ├── search/          # Talent search & filtering
│   │   ├── talent/          # Candidate profile pages
│   │   ├── partner/         # University & partner portal
│   │   ├── shortlist/       # Saved candidates & shortlists
│   │   ├── profile/         # User profile management
│   │   └── api/             # Next.js route handlers
│   ├── components/          # Modular component architecture
│   │   ├── auth/            # Authentication forms & protected routes
│   │   ├── candidate/       # Candidate portal workspace & CV builder
│   │   ├── landing/         # Modular landing page sections
│   │   ├── layout/          # Header, footer & navigation
│   │   ├── talent/          # Recruiter talent discovery cards & badges
│   │   └── ui/              # Design system primitives (Radix UI / Tailwind)
│   ├── config/              # App constants & talent configs
│   ├── db/                  # Drizzle ORM schema & database client
│   ├── lib/                 # Core utilities & services (AI, API, Supabase)
│   └── types/               # TypeScript domain type definitions
├── DESIGN.md                # System UI/UX design specifications
├── AGENTS.md                # AI Pair Programming & architectural rules
├── public/                  # Static assets & icons
└── package.json             # Project configuration & scripts
```

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server at `localhost:3000` |
| `npm run build` | Builds the production bundle |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint code quality checks |
| `npm run db:generate` | Generates SQL migrations from the Drizzle schema |
| `npm run db:migrate` | Applies pending migrations to the database |
| `npm run db:check` | Validates migrations for drift/conflicts |
| `npm run test:e2e` | Runs cross-account e2e flow tests (local, pre-release only) |

> E2E tests need a live Supabase instance with a seeded database and `E2E_*` credentials — they are excluded from CI and must be run locally against staging before a release (see [docs/runbook.md](docs/runbook.md)).

---

# Development token grant

Database mode keeps token balances in `token_accounts` and every change in
`token_ledger_entries`. For local development only, set
`DEV_TOKEN_GRANT_ENABLED=true` while running with `NODE_ENV=development`.

After signing in as an active recruiter, run this in the browser console to
grant 25 tokens once:

```js
fetch("/api/dev/token-grant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 25, idempotencyKey: "local-recruiter-seed" }),
}).then((response) => response.json()).then(console.log);
```

Repeating the same `idempotencyKey` is safe and does not change the balance a
second time. The route never uses or exposes a Supabase service-role key.

<div align="center">

Made with ❤️ by the **ProofyLink Team**

</div>
