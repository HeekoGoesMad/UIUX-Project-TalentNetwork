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
* **UI Components:** [Radix UI](https://www.radix-ui.com/), Custom Design System (Geist Font, Sonner Toasts, Lucide Icons)
* **AI & Machine Learning:** [Vercel AI SDK](https://sdk.vercel.ai/) integrated with [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) (`gpt-4o`) with automatic fallback to structured mock responses
* **Validation & Types:** [Zod](https://zod.dev/), [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 20.0.0
* npm, pnpm, or yarn

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

Create a `.env.local` file with the following keys:

```env
# AI Provider ('azure' or 'mock')
AI_PROVIDER=azure

# Azure OpenAI Credentials (Required if AI_PROVIDER=azure)
AZURE_OPENAI_ENDPOINT=https://<your-resource-name>.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=<your-deployment-name>
AZURE_OPENAI_API_KEY=<your-api-key>
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

> **Note:** If `AI_PROVIDER` is set to `mock` or credentials are missing, the system gracefully falls back to structured mock data powered by Zod schemas.

## Database and Authentication

The first database phase uses Supabase Auth and PostgreSQL with Drizzle ORM.

1. Create a Supabase project and enable email/password authentication.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the pooled `DATABASE_URL`.
3. Generate migrations with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate`.
5. Validate the schema with `npm run db:check`.

Never use `drizzle-kit push` or `drizzle push`. Keep generated migrations committed. The application can still run in local demo fallback mode when Supabase variables are absent, but real registration, persistent profiles, and database consent requests require Supabase configuration.

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
