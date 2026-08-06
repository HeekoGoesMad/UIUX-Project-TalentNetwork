
# Talent Network Implementation Plan

## Confirmed Direction

- Use the recommended defaults.
- Present the mock user as an internal recruiter.
- Defer dark mode until a future task.
- Add shadcn/ui, Lucide React, Sonner, and next-themes-compatible structure where useful, but do not activate dark mode yet.
- Implement the full brief rather than a phased prototype.

## Implementation Plan

### 1. Foundation

- Replace the starter page.
- Update metadata to Talent Network.
- Configure Inter Tight and Geist Mono.
- Establish the light-mode oklch design tokens from `DESIGN.md`.
- Add shared `cn()` utility and shadcn-style primitives.
- Add toast support and application-level state provider.

### 2. Application Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── pricing/page.tsx
│   ├── search/page.tsx
│   ├── search/loading.tsx
│   ├── talent/[candidateId]/page.tsx
│   ├── talent/[candidateId]/loading.tsx
│   ├── talent/[candidateId]/not-found.tsx
│   ├── shortlist/page.tsx
│   └── dashboard/page.tsx
├── components/
│   ├── layout/
│   ├── wallet/
│   ├── candidates/
│   ├── search/
│   ├── shortlist/
│   ├── dashboard/
│   └── ui/
├── data/
├── lib/
├── providers/
└── types/
```

### 3. Mock Data

- Add around 30 candidate records.
- Use varied Indonesian cities, roles, experience levels, salary ranges, availability states, skills, education, certifications, and portfolios.
- Use deterministic initials/CSS avatar placeholders instead of remote image dependencies.
- Add pricing bundles, testimonials, filter taxonomy, and FAQ content.

### 4. Mock Recruiter State

- Internal recruiter identity: `Alex Morgan`.
- Starting balance: 25 tokens.
- Persist token balance, scan history, scanned candidate IDs, shortlist entries, shortlist notes, and recently viewed candidates.
- Use idempotent scanning:
  - First scan deducts one token.
  - Repeat visits do not deduct again.
  - Zero-token users can browse previews but cannot scan.
- Persist state under a versioned `localStorage` key.

### 5. Landing and Pricing

- Build a high-signal recruiting workspace aesthetic.
- Include the hero, value propositions, Search → Scan → Connect flow, testimonials, token teaser, and footer navigation.
- Build static pricing bundles for 10, 50, 100, and 500 tokens.
- Pricing actions show a demo-only toast and do not alter the wallet.

### 6. Search

- Implement URL-driven keyword and filter state.
- Support keyword, experience, location, availability, skills, education, salary range, sort order, and grid/list view.
- Use numbered pagination with 12 results per page.
- Add candidate skeletons, no-results state, filter reset, mobile filter drawer, candidate save action, and locked previews with visible salary range.

### 7. Candidate Profiles

- Opening a profile is free.
- Scanning is explicit and costs one token.
- Locked state includes blurred identity/avatar, role, location, experience, availability, skills, and salary range.
- Unlocked state includes full identity/avatar, summary, work history, education, skills and endorsements, certifications, portfolio, and contact details.
- Add scan confirmation, loading state, success/error toasts, shortlist action, and copy-link sharing.

### 8. Shortlist

- Display saved and scanned candidate cards.
- Support notes saved on blur, remove action, CSV export, empty state, and toast feedback.
- Export candidate identity, role, location, experience, skills, availability, salary, and notes.

### 9. Dashboard

- Present the user as an internal recruiter.
- Include token balance summary, low-balance warning, recent scans, scanned profiles count, shortlisted candidates count, quick search shortcut, continue where you left off, and recent shortlist preview.
- Provide useful empty states for new users.

### 10. Global UX

- Responsive header with logo, Search, Shortlist, Dashboard, token balance, and recruiter profile menu.
- Mobile hamburger navigation.
- Global `Ctrl+K` / `⌘K` search dialog.
- Token history dialog.
- Toast notifications for scans, shortlist changes, sharing, pricing actions, and insufficient tokens.
- Light mode only for this implementation.
- Preserve token structure and component APIs so dark mode can be enabled later without reworking the UI.

### 11. Verification

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Use the Next.js development loop to verify browser behavior and responsive layouts.
- Confirm localStorage persistence across refreshes and routes.
- Confirm no token deduction occurs on repeat scans or profile refreshes.

## Scope Constraint

This file records the approved plan only. Application source code must remain unchanged while saving this plan.
