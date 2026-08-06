# ProofyLink Talent Network Merge Plan

## Plan Metadata

- Created: 2026-08-06 15:41:11 UTC+08:00
- Status: Approved for implementation
- Source mockup: `D:\Job Related\Djoin\mockui\ProofyLink Talent Network Talent Network UI Mockup`
- Target application: `D:\Job Related\Djoin\uiux\mock-talentNetwork`
- Primary language: Indonesian
- Technical labels: English where they are commonly used in product interfaces
- Theme: Light mode first; preserve a future-compatible token structure

## Confirmed Direction

- Keep Next.js App Router as the main application.
- Use the local ProofyLink mockup as the primary product and visual reference.
- Preserve the current app's stronger behavior and URL-based route structure.
- Add candidate-facing authentication and profile experiences.
- Add polished placeholder routes for jobs and messages.
- Keep simulated authentication, payments, and messaging clearly demo-only.
- Use Indonesian as the main product language.
- Use common technical labels such as `AI Summary`, `Dashboard`, `Token`, `Profile`, `Search`, `Portfolio`, and `Verified Talent` where appropriate.

## Current Mockup Findings

The ProofyLink mockup is a Vite single-page prototype with in-memory screen states rather than URL routes.

### Mockup screens

- Public landing page
- Login
- Two-step registration
- Candidate profile
- Recruiter candidate search
- Recruiter dashboard
- Candidate unlock confirmation and success modal

### Mockup product model

- Two user roles: candidate and recruiter
- Verified talent profiles
- Candidate career status
- AI-generated profile summary
- Recruiter search and filters
- Masked candidate identity before unlock
- One-token profile unlocking
- Recruiter token balance and unlock history
- Candidate skills, tools, experience, education, and portfolio

### Mockup visual language

- Deep navy brand foundation
- Emerald verification and action accent
- Slate neutral surfaces and typography
- Pale blue-gray workspace background
- Rounded cards, controls, and modal surfaces
- Thin borders and restrained shadows
- Status badges and skill/tool chips
- Navy profile covers with overlapping avatars
- Navy-to-blue AI Summary panels
- Dark branded marketing and authentication panels
- Subtle grid texture on dark surfaces

## Route Plan

### Public routes

- `/`
  - ProofyLink marketing landing page
  - Indonesian hero copy
  - Navy grid background
  - Emerald primary CTA
  - Platform statistics
  - Feature pills
  - Login and registration actions

- `/pricing`
  - Token bundles
  - Indonesian copy
  - Demo-only purchase feedback
  - No token balance mutation until payments are implemented

### Authentication routes

- `/login`
  - Split-screen authentication layout
  - Candidate and recruiter role selector
  - Email/password form
  - Password visibility toggle
  - Validation and loading states
  - Social login placeholders

- `/register`
  - Two-step registration flow
  - Role selection cards
  - Candidate/recruiter-specific fields
  - Password strength indicator
  - Terms agreement
  - Validation and loading states

### Candidate routes

- `/profile`
  - Candidate-facing profile
  - Profile cover and avatar
  - Verified Talent badge
  - Career status
  - About section
  - AI Summary
  - Work experience
  - Education
  - Skills and tools
  - Portfolio
  - Profile completeness card
  - Profile statistics

- `/jobs`
  - Polished coming-soon placeholder
  - Explain that job discovery is planned
  - Link back to profile and relevant product areas

- `/messages`
  - Polished coming-soon placeholder
  - Explain that recruiter-candidate messaging is planned
  - Link back to dashboard and search

### Recruiter routes

- `/search`
  - Recruiter candidate discovery page
  - ProofyLink filter sidebar composition
  - Search by skill, industry, role, and city
  - Verified-only filter
  - Career-status filters
  - Experience, location, education, salary, and availability filters
  - Candidate cards with masked identity, verification, status, AI Summary, skills, tools, location, and unlock action
  - Preserve URL-backed filters, pagination, grid/list view, shortlist actions, and mobile filter drawer

- `/dashboard`
  - Recruiter dashboard
  - Token balance and progress
  - Profiles unlocked
  - Shortlisted candidates
  - Search activity
  - Unlock history
  - Saved candidates
  - Weekly activity visualization
  - Low-balance warning
  - Useful empty states

- `/shortlist`
  - Saved and scanned candidates
  - Private notes
  - Removal
  - CSV export
  - Empty state

- `/talent/[candidateId]`
  - Full candidate profile
  - Navy profile cover
  - Overlapping avatar
  - Locked/unlocked state
  - Scan confirmation modal
  - Token balance preview
  - Unlock warning
  - Loading and success states
  - Contact details after unlock

## State and Behavior Plan

- Extend the existing `AppProvider` with demo auth/session state.
- Support candidate and recruiter roles.
- Add role-aware navigation and route guards.
- Preserve the existing versioned LocalStorage key for recruiter state.
- Preserve the initial recruiter token balance and idempotent scans.
- Preserve scan history, shortlists, notes, and recently viewed candidates.
- Add candidate profile state only where needed for the candidate-facing experience.
- Keep simulated authentication explicitly labeled as demo behavior.
- Keep `/jobs` and `/messages` presentation-only placeholders without fake backend behavior.

## Design System Rewrite

Update `DESIGN.md` and the application tokens to make the ProofyLink mockup the source of truth.

### Typography

- Primary: `Plus Jakarta Sans`
  - Brand, navigation, headings, forms, cards, and body copy
- Utility: `JetBrains Mono`
  - Token counts, activity timestamps, compact metrics, and technical metadata
- Load fonts through `next/font/google` in `layout.tsx`.
- Define and document font variables in `globals.css`.

### Color system

- Workspace background: pale blue-gray
- Primary brand: deep ProofyLink navy
- Accent: emerald
- Text: navy/slate hierarchy
- Borders: cool slate
- Surfaces: white and lightly tinted blue

Status palette:

- Emerald: Open to Work, verified, success
- Amber: Open for Opportunities, warnings
- Blue: Freelance Available
- Violet: Internship Available
- Slate: Not Available
- Red: errors and destructive actions

Document a navy scale from `navy-950` through `navy-50` based on the mockup.

### Components and patterns

- Major cards and dialogs: `rounded-2xl`
- Buttons, inputs, profile controls, and compact cards: `rounded-xl`
- Thin cool-gray borders
- Subtle Tailwind shadows
- Navy profile covers and controlled gradients
- Emerald status dots and verification markers
- Pill badges for statuses, skills, tools, and feature metadata
- Pale-blue AI Summary surfaces
- Monospace token displays
- Standardized locked candidate privacy treatment
- Standardized focus, disabled, loading, and reduced-motion states

### Icon system

- Use `lucide-react` consistently.
- Replace inline SVG icon definitions from the mockup with Lucide components.
- `size-3`: compact metadata
- `size-4`: standard controls
- `size-5`: navigation and status
- `size-6` or larger: feature and empty-state icons
- Icon-only controls must provide accessible labels and pressed states.

## Component Plan

### Layout

- `components/layout/site-header.tsx`
- `components/layout/site-footer.tsx`
- Role-aware navigation
- Mobile navigation
- User menu

### Authentication

- `components/auth/auth-shell.tsx`
- `components/auth/role-selector.tsx`
- `components/auth/login-form.tsx`
- `components/auth/register-form.tsx`
- `components/auth/password-strength.tsx`

### Candidates

- `components/candidates/candidate-card.tsx`
- `components/candidates/candidate-profile-header.tsx`
- `components/candidates/candidate-status-badge.tsx`
- `components/candidates/verified-badge.tsx`
- `components/candidates/skill-chip.tsx`
- `components/candidates/tool-chip.tsx`
- `components/candidates/ai-summary-card.tsx`
- `components/candidates/unlock-modal.tsx`

### Dashboard

- `components/dashboard/stat-card.tsx`
- `components/dashboard/token-balance-card.tsx`
- `components/dashboard/unlock-history.tsx`
- `components/dashboard/weekly-activity.tsx`

### Candidate profile

- `components/profile/profile-section.tsx`
- `components/profile/profile-completeness.tsx`
- `components/profile/experience-timeline.tsx`
- `components/profile/portfolio-card.tsx`

### Placeholders

- Shared polished coming-soon layout for `/jobs` and `/messages`.

### UI primitives

Continue using shadcn-style primitives and standardize or add:

- Select
- Checkbox
- DropdownMenu
- Alert
- Empty
- Skeleton
- Spinner
- Progress
- Separator

## Implementation Phases

### Phase 1: Route and state foundation

- Add auth routes and demo session state.
- Add candidate profile route.
- Add jobs and messages placeholder routes.
- Add role-aware navigation and guards.
- Preserve recruiter LocalStorage behavior.

### Phase 2: Design-system rewrite

- Rewrite `globals.css` tokens.
- Update `layout.tsx` font loading and metadata.
- Update `DESIGN.md`.
- Standardize brand logo, cards, buttons, inputs, badges, dropdowns, dialogs, and loading states.

### Phase 3: Landing and authentication

- Rebuild the dark navy ProofyLink landing page.
- Build split-screen login.
- Build two-step registration.
- Add Indonesian product copy and English technical labels where appropriate.

### Phase 4: Recruiter workspace

- Redesign search around the mockup's sidebar and candidate card composition.
- Preserve URL filters, pagination, grid/list view, shortlist, and mobile behavior.
- Add AI Summary, verification, status, tools, and token unlock presentation.

### Phase 5: Candidate and recruiter profiles

- Rebuild recruiter candidate profiles using the mockup's profile composition.
- Build the candidate-facing `/profile` experience.
- Preserve explicit scan confirmation and idempotent token deduction.

### Phase 6: Dashboard and supporting routes

- Redesign dashboard with token balance, unlock history, saved candidates, and activity.
- Restyle shortlist and pricing.
- Add polished jobs/messages placeholders.

### Phase 7: Verification

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Run the Next.js development loop at desktop and mobile widths.
- Verify auth transitions and role guards.
- Verify token persistence and repeat-scan idempotency.
- Verify URL search state, pagination, and mobile filters.
- Verify shortlist notes and CSV export.
- Verify loading, empty, placeholder, and not-found states.

## Notion Documentation Plan

Create a private parent page and folder in Adrienne's Notion workspace:

```text
Private workspace
└── Web App Projects
    └── talent-network WebApp
```

The documentation folder should contain:

1. `00 — Project Overview`
2. `01 — Route Map`
3. `02 — Product Flows`
4. `03 — Design System`
5. `04 — Architecture`
6. `05 — Implementation Progress`
7. `06 — QA Checklist`
8. `07 — Decisions and Backlog`
9. `08 — Release Notes`

### Documentation metadata

- Folder: `talent-network WebApp`
- Parent page: `Web App Projects`
- Created: `2026-08-06 15:41:11 UTC+08:00`
- Initial status: `Planning / Design Merge Confirmed`
- Primary language: Indonesian
- Technical terms: English where commonly used

### Progress report format

Each implementation update should include:

- Timestamp
- Status
- Area
- Completed
- Changed files
- Verification
- Risks/blockers
- Next step

Initial progress report:

```text
Timestamp: 2026-08-06 15:41:11 UTC+08:00
Status: Planning / Design Merge Confirmed
Area: Product direction and design audit

Completed:
- Read the local ProofyLink Talent Network mockup
- Compared mockup flows with the current Next.js implementation
- Confirmed candidate/authentication routes should be added
- Confirmed /jobs and /messages should be polished placeholder routes
- Confirmed Indonesian as the primary product language
- Selected Plus Jakarta Sans and JetBrains Mono as the typography direction
- Selected navy, emerald, and slate as the merged visual language

Verification:
- Mockup source reviewed
- Current route and component structure reviewed
- Design-system gaps identified

Risks/blockers:
- Authentication and backend behavior remain demo-only
- Jobs and messages remain placeholders

Next step:
- Implement route foundation and design-system rewrite
```

## Scope Constraints

- This plan does not itself change application source code.
- The mockup source folder remains a reference and is not modified.
- Do not add real authentication, payments, messaging, or jobs backend behavior in this merge unless separately requested.
- Preserve existing user changes and unrelated repository files.
