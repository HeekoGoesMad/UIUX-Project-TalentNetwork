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

## Admin & Recruiter Approvals

- Promote an admin directly in SQL (no UI flow): `UPDATE users SET role = 'admin' WHERE email = '...';`
- Approve/reject recruiters via API — `PATCH /api/admin/recruiters/{userId}` with body `{"action": "approve" | "reject", "reason": "..."}` (reason mandatory for reject); list pending recruiters first with `GET /api/admin/recruiters`. Both require a signed-in user whose `users.role` is `admin` (session cookie auth).
- Approval flips `users.recruiter_provisioning_status` to `active`/`rejected`; audit entries land in the **`audit_logs`** table (`admin.recruiter.*` and `organization.member.updated`).

## Notification Outbox Worker

Polls `notification_deliveries` for due email rows (status `pending`/`failed`, `next_attempt_at` NULL or past) in small batches, claims each row with an atomic `next_attempt_at` lease (no `sending` status exists in the frozen enum), sends via the same provider contract as the app (mock unless `NODE_ENV=production` + Brevo env), backs off `next_attempt_at` on failure (5min doubling, max 24h; parked with `next_attempt_at = NULL` after `OUTBOX_MAX_ATTEMPTS` for manual retry), then exits for cron (0 = sent/nothing due, 2 = any delivery failed, 1 = config/connection error). No new dependencies: plain `node` + the repo's existing `postgres` driver.

- Run: `npm run worker:outbox` (needs `DATABASE_URL`); dry-run: `npm run worker:outbox -- --dry-run`. Tuning env: `OUTBOX_BATCH_SIZE` (default 25), `OUTBOX_MAX_ATTEMPTS` (default 10), `OUTBOX_LEASE_SECONDS` (default 300).
- Cron example (every 5 min): `*/5 * * * * cd /app && DATABASE_URL="$DATABASE_URL" NODE_ENV=production EMAIL_PROVIDER=brevo BREVO_API_KEY="$BREVO_API_KEY" BREVO_SENDER_EMAIL="$BREVO_SENDER_EMAIL" BREVO_SENDER_NAME="$BREVO_SENDER_NAME" npm run worker:outbox >> /var/log/outbox-worker.log 2>&1`.
- Explicit non-goal: the request path still sends email inline (`createNotificationWithDeliveries` awaits `sendNotificationEmail`); the worker only retries rows left pending/failed/due. Switching the request path to enqueue-only is follow-up work behind a documented env flag, after this worker is deployed and observed.

## Pre-Release Checklist

- [ ] CI green on release branch: lint + typecheck (`npx tsc --noEmit`) + build.
- [ ] E2E run locally against staging: `npm run test:e2e` with `E2E_BASE_URL`, `E2E_RECRUITER_EMAIL/PASSWORD`, `E2E_CANDIDATE_EMAIL/PASSWORD` set (CI does not run e2e).
- [ ] Production env verified: `DEV_AUTH_BYPASS`, `DEV_TOKEN_GRANT_ENABLED`, `NEXT_PUBLIC_DEMO_MODE` are **absent or false** in Vercel production environment variables.
- [ ] If schema changed: migrations applied to staging, then production DB, **before** code promotion.
