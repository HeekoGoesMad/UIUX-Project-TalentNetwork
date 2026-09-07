# API Surface — TalentNetwork

> Generated-from-code snapshot, 2026-09-07. Source of truth is `src/app/api/**/route.ts`; refresh this file when routes change.

Conventions: `requireAdmin` = admin role only. `getCurrentAppUser` = any authenticated app user (role checks noted per endpoint; auth failures surface as 401/403 from the helper). `getRecruiterScope` = recruiter with active org membership (org-scoped data). `getAiEndpointAuth` = authenticated (allowed roles noted) + per-minute/daily AI rate limits (429). `billingScope`/`currentUserOrError` = authenticated org member. Unless noted, success is 200 JSON; validation errors are 400; missing DB is 503.

## Admin (`requireAdmin` on all)

- `GET /api/admin/audit-log` — query: `search?`, `action?` (filtered in memory, max 300 rows). Errors: 503.
- `GET /api/admin/companies` — query: `search?`, `status?` (verification status; filtered in memory). Errors: 503.
- `PATCH /api/admin/companies/:companyId` — body: `verificationStatus?` (pending|approved|need_revision|rejected|suspended), `verificationNotes?`, `nib?`, `npwp?`, `industry?`, `companyScale?`, `province?`, `city?`, `companyEmail?`, `website?`, `linkedinUrl?`, `subscriptionTier?`, `subscriptionStatus?` (strict). Errors: 400/404.
- `GET /api/admin/dashboard` — no params; aggregate counts (companies by status, token balances, unlocks, screenings). Errors: 503.
- `GET /api/admin/organizations` — no params; orgs with memberCount + billing. Errors: 503.
- `PATCH /api/admin/organizations` — body: `organizationId` (uuid), `spendLimit?` (int ≥ 0|null), `billingOwnerId?` (uuid|null); upserts billing account. Errors: 400/404/503.
- `POST /api/admin/organizations` — body: `name` (2–120), `slug` ([a-z0-9-], 2–80). Success: 201. Errors: 400/409.
- `GET /api/admin/recruiters` — no params; on DB error returns `{ recruiters: [] }` with 200.
- `PATCH /api/admin/recruiters/:userId` — body: `action` (approve|reject|request_revision), `reason?` (required for reject/request_revision), `organizationId?`, `organizationRole?`; non-uuid id returns demo echo `{ success, status, demo: true }`. Errors: 400/404.
- `DELETE /api/admin/recruiters/:userId` — deletes user row + audit log. Errors: 400/404/500.
- `GET /api/admin/tokens` — no params; org token accounts with purchased/used breakdown. Errors: 503.
- `POST /api/admin/tokens` — body: `organizationId`, `amount` (int > 0), `type` (grant|refund), `reason` (1–500), `idempotencyKey` (8–200, namespaced `admin:`). Success: 201 (200 if idempotent replay). Errors: 400/409 (insufficient balance)/503.

## Auth, bootstrap, profile

- `POST /api/auth/sync` — Supabase session (no app auth yet); body: `name` (2–160), `companyName?`, `role?` (candidate|recruiter|partner). Errors: 400/401 (bad session)/403 (role mismatch)/503.
- `GET /api/app/bootstrap` — `getCurrentAppUser({ allowPending: true })`; self-heals unsynced fresh logins; returns profile, candidate profile + sections, org, shortlists, consents, notifications, token. Errors: 401/403/503.
- `GET /api/profile` — any authenticated; own profile + (candidates) candidateProfile + sections. Errors: 503.
- `POST /api/profile/sync` — Supabase session; body: `candidateProfileSyncSchema` (see `src/lib/profile/schema.ts`). Errors: 400 (details per field)/401/500/503.
- `POST /api/recruiter/onboarding` — `getCurrentAppUser({ allowPending: true })`; body: PIC fields (`picName`, `picEmail`, `picPhone`, `picPosition?`) + company fields (`companyName`, `description?`, `industry?`, `companySize?`, `city?`, `officeAddress?`, `website?`, `nibNumber?`, `nibFileName?`, `npwpNumber?`, `npwpFileName?`, `aktaFileName?`, `ktpFileName?`); creates/updates profile + org + membership in a transaction. Errors: 400/500.

## Talent search & candidates

- `GET /api/candidates` — any authenticated; query: `q?` (≤120), `page?`/`limit?` (≤50), `sort?` (relevance|name), `locations?` (repeatable). Errors: 400/503.
- `GET /api/candidates/:candidateId` — any authenticated; only `isPublished` profiles (else 404). Errors: 404/503.

## CV & verifications (candidate-centric)

- `GET /api/cv/documents` — candidate only (dev-bypass returns demo docs); lists own docs. Errors: 403/503.
- `POST /api/cv/documents` — candidate only; multipart `file` PDF ≤ 5 MB, `%PDF-` header, ≤ 50 pages. Success: 201. Errors: 400/403/409 (no profile)/413/415/503.
- `GET /api/cv/documents/:documentId` — candidate owner only (+ dev-bypass demo); returns doc + downloadUrl + review stub. Errors: 400/403/404/503.
- `PATCH /api/cv/documents/:documentId` — candidate owner only; body: `originalFileName?`, `status?` (uploaded|review|approved|rejected|deleted), ≥1 key. Errors: 400/403/404/503.
- `POST /api/cv/documents/:documentId/versions` — candidate only; body: `template` (ats|creative), `content` (record, default {}). Success: 201. Errors: 400/403/404/409 (deleted/rejected doc)/503.
- `POST /api/cv/export` — any authenticated; body: `profile` (full CV object), `templateId` (ats|modern|sidebar|minimal, default ats); returns rendered file; per-user rate limit. Errors: 400/429/500.
- `POST /api/cv/import` — any authenticated; multipart PDF `file` ≤ 5 MB; returns parsed CV JSON; per-user rate limit. Errors: 413/415/429.
- `GET /api/verifications` — candidate: own verifications; admin: all (joined); other roles 403; dev-bypass returns demo list. Errors: 403/503.
- `POST /api/verifications` — candidate only; body: `type` (identity|email|phone|education|employment|certification|portfolio), `evidence?` (record). Success: 201. Errors: 400/403/409 (no profile)/503.
- `PATCH /api/verifications/:verificationId` — candidate: only → `disputed` with `disputeReason` (10–1000, only from verified|expired|revoked); admin: any `status` (+`provider?`, `evidence?`, `expiresAt?`). Errors: 400/403/404/409/503.

## Consent

- `GET /api/consent-requests` — candidate, recruiter, or pending recruiter (pending gets `[]`); query: `page?`, `limit?` (≤100), `candidateProfileId?`. Errors: 400/503.
- `POST /api/consent-requests` — recruiter scope; body: `candidateProfileIds` (1–100 unique uuids), `purpose` (1–500), `message?` (≤2000), `expiresAt?` (datetime). Success: 201. Errors: 400/503.
- `PATCH /api/consent-requests/:itemId` — candidate only; body: `decision` (approved|declined). Errors: 400/403/503 (+ service-status passthrough, e.g. 404/409).

## Screening & AI

- `POST /api/screening-runs` — recruiter scope; body: `candidateProfileId`, `consentRequestItemId`, `idempotencyKey` (8–200, namespaced by org). Success: 201 (200 on idempotent replay). Errors: 400/503 (+ service passthrough).
- `GET /api/screening-runs` — recruiter scope; query: `candidateProfileId` (required uuid) → latest run. Errors: 400/503.
- `POST /api/screening-runs/:runId/result` — recruiter scope; body: `skills?` (string[], max 40, default []). Errors: 400/503 (+ service passthrough).
- `POST /api/ai/summary` — any authenticated; free-form profile object; `strict?` via query or body. Errors: 400/503 (unconfigured provider).
- `POST /api/ai/roadmap` — any authenticated; free-form body. Errors: 400.
- `POST /api/ai/gap-analysis` — any authenticated; free-form body. Errors: 400.
- `POST /api/ai/cv-builder` — any authenticated; free-form body. Errors: 400.
- `POST /api/ai/career-advisor` — any authenticated; free-form body. Errors: 400.
- `POST /api/ai/interview-questions` — roles recruiter|candidate|admin; free-form role-context body. Errors: 400/403.
- `POST /api/ai/screening-insight` — roles recruiter|admin; body must include `consent: true` (else 403); 409 when a real DB is configured without dev bypass (must use screening-runs instead). Errors: 400/403/409.

## Jobs & applications

- `GET /api/jobs` — public (unauthenticated sees `published` only); query: `q?`, `status?` (recruiter: own org), `page?`, `limit?` (≤100). Errors: 400/503.
- `POST /api/jobs` — recruiter scope; body: `title`, `description` (10–20k), `employmentType`, `workArrangement`, `location?`, `requiredSkills?`/`preferredSkills?` (≤30 each). Success: 201. Errors: 400/503.
- `GET /api/jobs/:jobId` — public for published; recruiters additionally see own-org drafts. Errors: 404/503.
- `PATCH /api/jobs/:jobId` — recruiter scope (own org); body: any of title/description/employmentType/workArrangement/location/status (draft|published|closed)/skill lists; transitions draft→published|closed, published→closed only. Errors: 400/404/409/503.
- `GET /api/applications` — candidate: own; recruiter: own org; query `page?`, `limit?` (≤100). Errors: 400/503.
- `POST /api/applications` — candidate only; body: `jobId`, `coverNote` (20–4000). Success: 201. Errors: 400/403/404 (job not published)/409 (no profile or duplicate)/503.
- `GET /api/applications/:applicationId` — participant-gated (own candidate or org recruiter); includes stage history. Errors: 400/404/503.
- `PATCH /api/applications/:applicationId` — participant-gated; body: `status` (12-state enum), `reason?` (3–1000); candidates may only → `withdrawn` from pre-hire stages; recruiters follow fixed transition map. Errors: 400/404/409/503.

## Assessments

- `GET /api/assessment-templates` — recruiter scope; lists org templates. Errors: 503.
- `POST /api/assessment-templates` — recruiter scope; body (`templateSchema` in `src/lib/assessment.ts`): `name` (3–120), `description?`, `timeLimitMinutes?` (1–240), `attemptLimit` (1–5, default 1), `questions[1–50]` (unique `order`). Success: 201. Errors: 400/503.
- `GET /api/assessment-templates/:templateId` — recruiter scope; 404 if outside org. Errors: 400/404/503.
- `PATCH /api/assessment-templates/:templateId` — recruiter scope; partial template fields; `questions` required when updating; 409 if invitations already exist. Errors: 400/404/409/503.
- `GET /api/assessment-invitations` — candidate: own (+ latest attempt); recruiter: org list. Errors: 503.
- `POST /api/assessment-invitations` — recruiter scope; body: `applicationId`, `assessmentTemplateId`, `expiresAt?` (datetime). Success: 201. Errors: 400/404 (org mismatch)/409 (active dup)/503.
- `POST /api/assessment-attempts` — candidate only; body: `invitationId`; caps at 5 attempts per invitation. Success: 201. Errors: 400/403/404/409 (closed)/410 (expired)/503.
- `GET /api/assessment-attempts/:attemptId` — candidate (own) or org recruiter (answers hidden until submitted). Errors: 400/404/503.
- `PATCH /api/assessment-attempts/:attemptId` — candidate only (recruiters 403); body: `questionId?` + `response?` (autosave) and/or `submit: true` (requires all required answered). Errors: 400/403/404/409 (locked)/410/503.
- `GET /api/assessment-reviews/:attemptId` — candidate (sees status/score/reviewedAt only) or org recruiter (full + questions/answers). Errors: 400/404/503.
- `POST /api/assessment-reviews/:attemptId` — recruiter scope; body (`assessmentReviewCreateSchema`): `status?`, `score?` (0–100), `dimensionScores?`, `notes?`, `reviewedAt?`; requires submitted attempt. Success: 201. Errors: 400/404/409 (exists or not submitted)/503.
- `PATCH /api/assessment-reviews/:attemptId` — recruiter scope, own review only; same fields as POST. Errors: 400/404/503.

## Messaging, notifications, shortlists

- `GET /api/conversations` — any authenticated; query `limit?` (default 50); own conversations. Errors: 503.
- `POST /api/conversations` — recruiter scope; body: `candidateProfileId`; reuses existing thread. Success: 201 (200 if reused). Errors: 400/503 (+ service passthrough).
- `PATCH /api/conversations/:conversationId` — participant only; body: `action` (read|block|unblock). Errors: 400/403/503.
- `GET /api/messages` — participant only; query: `conversationId` (required uuid), `cursor?` (alias `before?`), `limit?`. Errors: 400/404/503 (+ service passthrough).
- `POST /api/messages` — participant only; body: `conversationId`, `body` (1–4000), `attachment?` ({name, mimeType, size ≤ 25 MB}); per-user rate limit. Success: 201. Errors: 400/429/503.
- `PATCH /api/messages/:messageId` — sender only (must remain participant); body: `body` (1–4000). Errors: 400/403/404/503.
- `DELETE /api/messages/:messageId` — sender only; soft delete. Errors: 403/404/503.
- `POST /api/messages/:messageId` — participant only (report); body: `reason` (5–500). Success: 201. Errors: 400/404/503.
- `GET /api/notifications` — own; query `limit?` (1–100, default 50); includes `unreadCount`. Errors: 503.
- `PATCH /api/notifications` — own; body: `notificationId`. Errors: 400/404/503.
- `POST /api/notifications` — own; body: `{ all: true }` (or action `mark_all_read`) marks all read. Errors: 400/503.
- `GET /api/notification-preferences` — own; returns stored prefs or defaults. Errors: 503.
- `PATCH /api/notification-preferences` — own; body: `inAppEnabled?`, `emailEnabled?`, `quietHours?` ({start,end HH:MM, timezone?}); upserted. Errors: 400/503.
- `GET /api/shortlists` — recruiter scope; query `page?`, `limit?` (≤100). Errors: 400/503.
- `POST /api/shortlists` — recruiter scope; body: `candidateProfileId`, `shortlistId?`, `notes?` (≤2000). Success: 201. Errors: 400/503 (+ service passthrough).
- `PATCH /api/shortlists` — recruiter scope; body: `itemId`, `notes` (≤2000). Errors: 400/503 (+ service passthrough).
- `DELETE /api/shortlists` — recruiter scope; body: `itemId`. Errors: 400/503 (+ service passthrough).

## Billing & tokens

- `GET /api/tokens` — recruiter scope; org token account balance. Errors: 503.
- `POST /api/dev/token-grant` — recruiter scope, dev-only (`NODE_ENV=development` + `DEV_TOKEN_GRANT_ENABLED=true`, else 404); body: `amount?` (1–1000, default 25), `idempotencyKey?`. Errors: 400/404/503.
- `GET /api/billing/packages` — public; active packages by price. Errors: 503.
- `POST /api/billing/packages` — admin role (via billing helper, not `requireAdmin`); body: `code` ([a-z0-9_-], 2–40), `name`, `tokenAmount` (>0), `priceMinor` (≥0), `currency` (3-letter), `validityDays?`. Success: 201. Errors: 400/403/409.
- `POST /api/billing/checkout` — org owner/admin only; body: `packageId`; optional `Idempotency-Key` header replays pending purchase; per-user rate limit. Success: 201 `{ purchase, checkoutUrl }`. Errors: 400/403/404/429/500|503.
- `GET /api/billing/purchases` — org member; purchase history (empty without org). Errors: 503.
- `GET /api/billing/account` — org member; billing account or null. Errors: 503.
- `PATCH /api/billing/account` — org owner/admin only; body: `billingOwnerId?` (must be org member), `spendLimit?` (≥0|null); upserts. Errors: 400/403/503.
- `POST /api/billing/webhooks/:provider` — public, `x-webhook-signature` required; body: `eventId`, `type` (paid*/refunded* sets), `purchaseId` or `providerReference`; deduped via paymentEvents, credits/refunds tokens. Success: 200 `{ received: true }`. Errors: 400/401.

## Health

- `GET /api/health` — public; `{ ok, version, uptimeSeconds, checks }`; 503 when DB down/missing.
- `GET /api/health/config` — public in dev; in production requires `x-healthcheck-token` (else 404); `{ status: ready|not_ready, environment, flags, readiness }`; 503 when invalid.
