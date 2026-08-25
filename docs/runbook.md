# Operations Runbook

Concise operational procedures for ProofyLink Talent Network (deployed on Vercel).

## Local Setup

1. `npm install` (npm only — do not use pnpm/yarn).
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the pooled `DATABASE_URL`.
3. Apply migrations: `npm run db:migrate`.
4. Start dev server: `npm run dev` → http://localhost:3000.

## Deploying

- Merging to the production branch triggers an automatic **production** deployment; every other branch/PR gets a **preview** deployment.
- Environment variables are configured once in Vercel: **Project Settings → Environment Variables**.
- CI (`.github/workflows/ci.yml`) must be green before merge: lint, typecheck, build (build requires no env secrets).

## Database Migrations

Schema changes are forward-only, applied via generated SQL — **never `drizzle push`**.

1. Edit `src/db/schema.ts`, then run `npm run db:generate` locally to generate migration SQL into `drizzle/`.
2. Review the generated SQL in `drizzle/` and commit it.
3. Apply with `npm run db:migrate` against **staging first**, verify, then apply to the **production DB** — always **before** promoting the code deploy that depends on it.
4. Validate with `npm run db:check`.

## Rollback

- Use Vercel **Deployments → previous deployment → Instant Rollback** to revert application code immediately.
- Schema migrations are **forward-only**: a rollback is only safe if the previous code is compatible with the current schema. Otherwise ship a **forward-fix migration** (additive columns/tables) instead of reverting SQL.

## Secrets & Rotation

Secrets live in Vercel Project Settings → Environment Variables (and locally in `.env.local`, never committed):

- `AZURE_OPENAI_API_KEY` — rotate in Azure Portal (Keys & Endpoint), update in Vercel, redeploy.
- `SUPABASE anon key` — rotate in Supabase Dashboard → Settings → API, update in Vercel.
- `DATABASE_URL` password rotation — change in Supabase, update `DATABASE_URL` in Vercel.

Rotation steps for any secret: generate new value at provider → update in Vercel → trigger redeploy → verify `/api/health` and core flows → revoke old value at provider. Never commit secrets to git; if leaked, rotate immediately.

## Health & Monitoring

- Health endpoint: `GET /api/health` — returns `{ ok: true }` (200) or `{ ok: false }` (503); runs a 3s-timeout `SELECT 1` DB probe. Point uptime monitoring at it.
- Logs: **Vercel Dashboard → Project → Deployments → select deployment → Runtime Logs**.
- Incident triage order:
  1. Check the **Deployments tab** — did the latest deploy fail?
  2. Open **Runtime Logs** for the failing deployment — look for `[health] database probe failed` or build errors.
  3. Hit `/api/health` — a 503 means the DB probe fails (connection string, pooled connection limits, or DB outage).

## Pre-Release Checklist

- [ ] CI green on release branch: lint + typecheck (`npx tsc --noEmit`) + build.
- [ ] E2E run locally against staging: `npm run test:e2e` with `E2E_BASE_URL`, `E2E_RECRUITER_EMAIL/PASSWORD`, `E2E_CANDIDATE_EMAIL/PASSWORD` set (CI does not run e2e).
- [ ] Production env verified: `DEV_AUTH_BYPASS`, `DEV_TOKEN_GRANT_ENABLED`, `NEXT_PUBLIC_DEMO_MODE` are **absent or false** in Vercel production environment variables.
- [ ] If schema changed: migrations applied to staging, then production DB, **before** code promotion.
