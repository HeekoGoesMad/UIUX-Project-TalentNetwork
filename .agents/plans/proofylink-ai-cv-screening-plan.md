# ProofyLink AI, CV Import, and Privacy-Safe Screening Plan

## Approved Decisions

- AI provider target: Azure OpenAI through the Vercel AI SDK.
- Local default: deterministic mock provider; Azure is opt-in through `AI_PROVIDER=azure`.
- Authentication/backend: remain local demo behavior for this phase.
- CV import: PDF only, sent to a Next.js server route.
- CV extraction results are suggestions; candidates can edit every field before approval.
- Candidate CV import and editing are free.
- Recruiter candidate previews are free, limited to 5 for the free trial.
- Recruiter screening consumes exactly 1 token.
- New recruiters receive 1 screening token and 5 candidate previews.
- Screening requires explicit per-screening candidate consent.
- First screening model is privacy-safe: data quality and role fit only.
- Financial/credit data is not used in this phase.
- PDF CV export is included.
- Indonesian is the primary UI language; common technical labels remain English.
- Preserve existing routes with compatibility redirects while adding clearer contextual routes.

## Security

- The API key previously shared in chat is compromised and must be revoked.
- Store the replacement key only in ignored `.env.local`.
- Never print, commit, transmit, or expose the API key to client code.
- Server routes must be the only code that can access Azure credentials.
- Default to `AI_PROVIDER=mock`.

## Environment

```env
AI_PROVIDER=mock
AZURE_OPENAI_ENDPOINT=https://aryamhrt-2010-resource.cognitiveservices.azure.com
AZURE_OPENAI_RESOURCE_NAME=aryamhrt-2010-resource
AZURE_OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_DEPLOYMENT=deepseek-v4-pro
AZURE_OPENAI_API_KEY=<rotated-key>
```

The exact Azure deployment name must remain configurable because the model name and deployment name are distinct Azure concepts.

## Dependencies

- `ai`
- `@ai-sdk/azure`
- `zod`
- Server-compatible PDF tooling for CV export

## AI Architecture

```text
Browser
  -> Next.js route handler
    -> AI service interface
      -> Mock provider by default
      -> Azure provider when enabled
```

AI routes must validate input, build a minimal safe context, return structured output, and provide safe loading/error states.

## Routes

### Candidate

```text
/candidate
/candidate/onboarding
/candidate/profile
/candidate/profile/edit
/candidate/profile/privacy
/candidate/cv
/candidate/cv/new
/candidate/cv/[cvId]/preview
/candidate/career-advisor
/candidate/career-gaps
/candidate/career-roadmap
/candidate/contact-requests
```

### Recruiter

```text
/recruiter
/recruiter/onboarding
/recruiter/dashboard
/recruiter/discover
/recruiter/discover/[candidateId]
/recruiter/shortlist
/recruiter/screenings
/recruiter/screenings/new
/recruiter/screenings/[screeningId]
/recruiter/screenings/[screeningId]/questions
/recruiter/billing
```

### API

```text
POST /api/cv/import
POST /api/ai/summary
POST /api/ai/screening-insight
POST /api/ai/interview-questions
POST /api/ai/career-advisor
POST /api/ai/gap-analysis
POST /api/ai/roadmap
POST /api/ai/cv-builder
POST /api/cv/[cvId]/export
```

## Candidate CV Import

```text
Upload PDF -> validate -> parse -> review suggestions -> edit -> approve -> save profile
```

Editable fields include identity, headline, about, experience, dates, achievements, education, skills, tools, industries, location, portfolio, certifications, career goals, target role, work arrangement, and Open To Work status.

## Consent

Consent states:

```text
not-requested
pending-candidate-consent
consented
declined
consent-expired
withdrawn
screening-in-progress
screening-completed
disputed
```

Recruiters request screening. Candidates accept or decline. A token is consumed only after valid consent and successful screening start.

## Privacy-Safe Screening Insight

The MVP analyzes:

- Missing dates
- Duplicate contact fields
- Overlapping employment periods
- Inconsistent role descriptions
- Skills without supporting evidence
- Incomplete education or portfolio data
- Stale profile data
- Salary and availability consistency
- Skill, experience, industry, education, tool, location, and Open To Work fit

Recommendation bands:

- 80–100: Sangat Direkomendasikan
- 50–79: Direkomendasikan
- 21–49: Perlu Pertimbangan
- 0–20: Perlu Review Mendalam

The UI must show numeric score, label, model version, data coverage, limitations, evidence, and a human follow-up action. No automatic reject or hire action is allowed.

## AI Features

- AI Summary: structured, evidence-backed, clearly labeled, editable by candidate.
- Interview Questions: neutral, role-relevant, editable, and free of invasive or discriminatory prompts.
- Career Advisor: profile-only streaming chat; never use recruiter-only screening data.
- Gap Analysis: distinguish missing, unevidenced, transferable, and irrelevant skills.
- Roadmap: editable and completable phases.
- CV Builder: ATS and Creative templates with candidate approval before saving generated text.

## PDF Export

- ATS template is single-column and parser-friendly.
- Creative template is visually expressive but readable.
- Preview precedes download.
- Candidate controls included sections.
- Generated timestamp and CV version are shown.

## Implementation Phases

1. Add plan and documentation updates.
2. Add AI SDK, schemas, mock provider, Azure adapter, and server routes.
3. Add candidate PDF import, review, editing, and profile persistence.
4. Add AI Summary, screening insight, interview questions, and consent flow.
5. Add candidate Career Advisor, gaps, roadmap, CV Builder, and PDF export.
6. Add recruiter trial entitlements, preview limit, and one-token screening ledger.
7. Rework route shells and UX orientation for candidate/recruiter workspaces.
8. Run visual, accessibility, functional, lint, TypeScript, build, and Playwright checks.
9. Update `DESIGN.md` and Notion progress report.

## Verification

- No secrets in source, logs, or client bundles.
- Mock provider works without Azure credentials.
- Azure adapter is disabled unless explicitly enabled.
- PDF-only upload rejects other file types.
- Imported CV fields are editable before approval.
- Preview does not consume tokens.
- Screening consumes one token exactly once.
- Consent is required before screening.
- AI outputs show source/limitation metadata.
- Routes are clear for both roles.
- UI has no invisible, clipped, low-contrast, or overlapping content at mobile, tablet, and desktop widths.

## Local Demo Test Access

This is a local demo flow only. No real username, password, company account, or Azure credential is required.

### Recruiter access

1. Open `/login`.
2. Select `Recruiter`.
3. Enter any valid email, for example `recruiter@test.local`.
4. Enter any password with at least 6 characters.
5. Submit the form.
6. Open `/recruiter/screenings/new` or use the `Screening` action from the recruiter workspace.
7. Click `Request candidate consent` for `candidate-1`.

### Candidate consent access

1. Log out from the recruiter session.
2. Open `/login`.
3. Select `Candidate`.
4. Enter any valid email, for example `candidate@test.local`.
5. Enter any password with at least 6 characters.
6. Open `/candidate/contact-requests`.
7. Click `Izinkan` for the pending screening request.

### Complete the screening test

1. Log out from the candidate session.
2. Log in again as `Recruiter` using any valid demo email and password.
3. Open `/recruiter/screenings/new`.
4. Click `Start screening (1 token)`.
5. Open `/talent/candidate-1`.
6. Review the result cards at the bottom of the candidate profile:
   - `Screening Insight`
   - Score and recommendation band
   - Data coverage
   - Evidence and limitations
   - `AI Summary`
   - Model/source metadata
   - Human-review disclaimer

### Expected test result

- Candidate preview remains free.
- Consent is required before screening.
- Exactly one screening token is consumed.
- The completed result is persisted in localStorage for the demo session.
- Refreshing `/talent/candidate-1` keeps the Screening Insight and AI Summary visible.
- Repeating the screening action does not consume a second token.
- The result does not use financial, credit, or protected-attribute data.

### Reset demo access

To restart the test from the beginning, clear browser localStorage for `localhost:3000`, then reload `/login`.
