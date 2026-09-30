# Phase 0 — Baseline & Comprehensive Performance Audit

**Branch**: `performance/phase-01-baseline`  
**Base Commit**: `72120e506f7b737516a179b807dd6475349ced5b` (`origin/dev`)  
**Audit Date**: October 2026  
**Environment**: Production Next.js 16.3.6 (Turbopack production build), Node 20+, Windows  

---

## 1. Executive Summary

This performance audit establishes a rigorous empirical baseline for `HeekoGoesMad/UIUX-Project-TalentNetwork` before executing targeted, non-breaking performance optimizations. All measurements below were gathered directly from compiled production builds (`npm run build` and `next start -p 3001`), database schemas, module graphs, and network inspection under production conditions.

### Primary Measured Critical Findings:
1. **Critical Client Root Bundle Bloat**: The initial landing page (`/`) downloads **1,140.66 KB of JavaScript across 14 script chunks** and **209.52 KB of CSS** before interactive execution. The entire Supabase JS SDK (`324.89 KB`), Lucide icon library (`169.89 KB`), and heavy state trees are bundled directly into the global root layout via `AppProvider` and `SiteHeader`.
2. **SSR Shell Starvation (Artificial Hydration Tax)**: `src/app/page.tsx` is completely marked `"use client"`. During SSR, if `!hydrated || user`, it renders **only a 568-byte fallback spinner**. The entire 8-section landing page (Hero, Marquee, HowItWorks, FeatureTabs, TalentPreview, Pricing, FAQ, CtaBanner) is withheld from the server-rendered HTML and forced to mount client-side during hydration, severely degrading First Contentful Paint (FCP) and Largest Contentful Paint (LCP).
3. **High-Latency Uncached Global Startup API**: Every page load invokes an unauthenticated `fetch("/api/partner/campuses")` from `AppProvider`'s `useEffect`, which takes **1,192.49 ms TTFB** to return a static 144-byte JSON payload from the database with no caching headers.
4. **Client-Side Heavy Search & Over-Fetching**: `/search` fetches 50 candidate objects (`/api/candidates?limit=50`, **1,261.34 ms TTFB** and 16.8 KB JSON) and executes full-text search, provincial location matching, sector matching, category filtering, sorting, and pagination in client JavaScript memory on every keystroke.
5. **Read-Path Database Mutations in Bootstrap**: `/api/app/bootstrap` executes up to 12 distinct queries across two sequential batches (`Promise.all`), queries unindexed relationships, and initiates **write mutations on the read path** (`db.update(schema.notifications)` via `distillNotificationContent`) while serializing the full user profile, token account, shortlists, consents, and candidate sections.
6. **Excessive Client Persistence Parsing**: 163 direct synchronous `localStorage` access points (top files: `app-provider.tsx` with 32 accesses, `recruiter-operations.tsx` with 28 accesses) causing synchronous JSON parsing (`JSON.parse`) on every render and state change.
7. **Unoptimized Media Delivery**: 10 distinct files use unoptimized native `<img>` tags (13 occurrences) with ESLint explicitly disabled (`/* eslint-disable @next/next/no-img-element */`), bypassing responsive srcset, WebP/AVIF compression, and Next.js image optimization. `next.config.ts` lacks remote patterns for `images.unsplash.com`.

---

## 2. Production Measurements (Empirical Baseline)

### 2.1 Route Latency & Payload Sizes (Production Mode `next start`)
*Measured using HTTP/1.1 client against local production server (`localhost:3001`) with warmed routes:*

| Route | Type | HTTP Status | TTFB (ms) | Total Duration (ms) | Document Size (Bytes) | SSR HTML Behavior |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `/` | Page (Static/Client) | 200 | 153.30 | 154.24 | 19,136 | Renders spinner only (568 B content); defers 8 landing sections to client |
| `/login` | Page (Static) | 200 | 20.65 | 20.81 | 20,404 | Server-rendered login shell |
| `/register` | Page (Static) | 200 | 27.14 | 27.40 | 20,315 | Server-rendered register shell |
| `/jobs` | Page (Static) | 200 | 19.78 | 32.79 | 54,444 | Prerendered static content |
| `/pricing` | Page (Static) | 200 | 26.51 | 26.69 | 27,880 | Prerendered static content |
| `/terms` | Page (Static) | 200 | 20.83 | 20.94 | 18,848 | Prerendered static content |
| `/privacy` | Page (Static) | 200 | 17.36 | 17.47 | 18,538 | Prerendered static content |
| `/api/partner/campuses` | API (Dynamic) | 200 | **1,192.49** | 1,193.26 | 144 | Dynamic DB query on every page load; `force-dynamic` |
| `/api/health` | API (Dynamic) | 200 | 113.56 | 114.10 | 75 | Health status check |
| `/api/candidates?limit=50` | API (Dynamic) | 200 | **1,261.34** | 1,262.36 | 16,879 | 50 serialized candidate profiles with all sections |
| `/api/app/bootstrap` | API (Dynamic) | 401 | 12.25 | 12.43 | 35 | Unauthenticated rejection (fast-path) |

### 2.2 Asset Transfer Breakdown for Root Landing Page (`/`)

#### JavaScript Chunks Loaded on Initial Page Visit:
| Chunk Name | Size (KB) | Size (Bytes) | Primary Contained Module / Purpose |
| :--- | :---: | :---: | :--- |
| `3ihmj3dineb52.js` | 324.89 | 332,688 | `@supabase/supabase-js` SDK (Auth, Realtime, PostgREST, Functions) |
| `2e_igbh5xz64l.js` | 223.56 | 228,922 | React DOM 19, Polyfills, Core React Runtime |
| `3u8cty4okvlat.js` | 152.36 | 156,013 | Next.js 16 Client Router, Server Action Client Runtime |
| `0cz1d0mv5g_q7.js` | 109.96 | 112,594 | Next.js Polyfill Bundle |
| `2xlq4lx_1ivrb.js` | 70.98 | 72,688 | Shared UI Layout Primitives & Utilities |
| `22-l02k3_e2ki.js` | 64.77 | 66,322 | Landing Page Component Tree & Feature Sections |
| `3-2j365-gcv67.js` | 50.83 | 52,050 | Navigation & Site Header / Footer Client Components |
| `0s9ijrbgmofdv.js` | 33.50 | 34,304 | App Context Provider (`AppProvider`) |
| `12l67p404ibhw.js` | 30.61 | 31,344 | Radix UI / Dropdown Components |
| `0gzhf7dgvuaj0.js` | 28.72 | 29,409 | TopProgressBar & Global Notifications UI |
| `3fntmmi971322.js` | 14.04 | 14,377 | Sonner Toast Framework |
| `0lmpo6ezpfv1q.js` | 13.17 | 13,486 | Hero Ambient Canvas Component |
| `32tfjk5n3lv75.js` | 12.58 | 12,882 | React Server Component Client Bootstrap Parameters |
| `turbopack-02yobo1rlhrd7.js`| 10.69 | 10,946 | Turbopack Client Chunk Loader Runtime |
| **Total JavaScript Transfer** | **1,140.66 KB** | **1,168,035 Bytes** | **14 scripts transferred upfront on first visit** |

#### Stylesheets:
| Stylesheet | Size (KB) | Size (Bytes) | Description |
| :--- | :---: | :---: | :--- |
| `3agbu47ki4f6d.css` | 205.93 | 210,871 | Tailwind CSS v4 Global Compiled Sheet |
| `0z5jmgumqraeh.css` | 3.59 | 3,680 | Font definitions (Jakarta Sans, JetBrains Mono) |
| **Total CSS Transfer** | **209.52 KB** | **214,551 Bytes** | |

#### Total Initial Asset Weight on `/`:
**1,350.18 KB (~1.35 MB)** uncompressed transferred over the network before any user interaction or application data load.

---

## 3. In-Depth Performance Inventory & Hotspots

### 3.1 Critical-Path & Client Boundary Bottlenecks
- **`src/app/layout.tsx`**: Wraps the entire application with `<AppProvider>`, `<TopProgressBar>`, `<AccessibilityInitializer>`, `<SiteHeader>`, and `<SiteFooter>`. Because `SiteHeader`, `SiteFooter`, and `TopProgressBar` are `"use client"`, virtually the entire document shell requires client hydration.
- **`src/app/page.tsx`**: The entire home route is a client component that checks `user` and `hydrated` from `useApp()`. During SSR, it renders only `<div role="status"><Loader2 className="animate-spin" />Memuat...</div>`. All landing page sections (`HeroSection`, `MarqueeStatsSection`, `HowItWorksSection`, `FeatureTabsSection`, `TalentPreviewSection`, `PricingSection`, `FaqSection`, `CtaBannerSection`) are mounted purely client-side after hydration completes.
- **Unnecessary Global Script Ingestion**: A visitor arriving on `/` or public `/jobs` downloads `@supabase/supabase-js` (324.9 KB) and the entire `AppProvider` state machine even if they never log in.

### 3.2 High-Latency & High-Bandwidth Endpoints
- **`/api/partner/campuses`**:
  - **Latency**: ~1,192 ms TTFB.
  - **Cause**: Queried dynamically from database (`verificationStatus = 'approved'`) with `export const dynamic = "force-dynamic"` and no caching header (`Cache-Control`), despite approved universities rarely changing.
  - **Duplication**: Queried in `AppProvider`'s `useEffect` on every page load, and queried again inside `/api/app/bootstrap`.
- **`/api/candidates?limit=50`**:
  - **Latency**: ~1,261 ms TTFB.
  - **Payload**: 16.8 KB JSON containing 50 complete candidate profile objects with all sections (skills, tools, experience, education, portfolio, preferences).
  - **Over-fetching**: Search page loads all 50 items and then performs in-memory filtering for pagination (pages of 12 items).
- **`/api/app/bootstrap`**:
  - **Latency**: Involves 12 separate database queries.
  - **Anti-pattern**: Mutates database on read requests (`distillNotificationContent` triggers `current.db.update(schema.notifications)` inside `GET`).

### 3.3 Database & Query Architecture
- **Missing Compound & Partial Indexes**:
  - `schema.partnerships`: Queried by `verificationStatus = 'approved'`, indexed on `verificationStatus`, but missing projection optimizations.
  - `schema.candidateProfiles`: Full-text ILIKE searches across `displayName`, `headline`, `targetRole`, `location`, and `summary` execute sequential table scans or partial btree scans without trigram indexing (`pg_trgm` GIN).
- **Connection Configuration**:
  - `src/db/index.ts` instantiates Postgres with `prepare: false`, `max: 5`, `idle_timeout: 20`, `connect_timeout: 10`. While safe for serverless Supabase Transaction Pooler (port 6543), connection re-use in edge/stateless contexts must be monitored to prevent connection thrashing.

### 3.4 State Management & Persistence (`localStorage`)
- **163 total `localStorage` accesses**:
  - `src/providers/app-provider.tsx`: 32 accesses. Reads and writes `talent-network-state-v1`, `proofylink-demo-session-v1`, `proofylink-permanent-scans-v1`, etc.
  - `src/components/recruiter/recruiter-operations.tsx`: 28 accesses.
  - `src/components/applications/application-ui.tsx`: 15 accesses.
  - `src/components/candidate/candidate-onboarding.tsx`: 12 accesses.
  - Synchronous `JSON.parse` and `JSON.stringify` occur directly in render paths and state initializer functions, blocking the browser main thread during navigation.

### 3.5 Images, Media & Fonts
- **Raw `<img>` Elements**: 13 raw `<img>` instances across 10 components bypass Next.js image optimization (e.g. `CandidateAvatar` in `src/components/talent/avatar.tsx`).
- **Missing Remote Patterns**: `next.config.ts` only allows `cms.solusisakti.id`. Avatars hosted on `images.unsplash.com` fallback to unoptimized, full-resolution external requests.
- **Explicit ESLint suppression**: `/* eslint-disable @next/next/no-img-element */` was placed on components instead of adopting `next/image` with explicit width/height or modern formats.

### 3.6 Background Work & Polling
- **`src/app/recruiter/pending/page.tsx`** & **`src/app/partner/pending/page.tsx`**:
  - Runs `setInterval(poll, 10000)` every 10 seconds unconditionally.
  - While it listens for `visibilitychange`, the interval timer continues running in the background when the tab is blurred or hidden.

---

## 4. Prioritized Phase Execution Roadmap

| Phase | Dedicated Branch | Target Scope & Objective |
| :---: | :--- | :--- |
| **Phase 1** | `performance/phase-02-client-boundary` | Decouple `"use client"` boundaries in `layout.tsx` and `page.tsx`. Server-render landing page sections; isolate client interactive islands (canvas, mobile drawer). |
| **Phase 2** | `performance/phase-03-global-state` | Optimize `AppProvider`: isolate state slices, eliminate redundant renders, eliminate unneeded global fetch triggers. |
| **Phase 3** | `performance/phase-04-bootstrap` | Optimize `/api/app/bootstrap`: eliminate write-on-read mutations, parallelize queries, slim projections, deduplicate campus list. |
| **Phase 4** | `performance/phase-05-search` | Optimize `/search` & `/api/candidates`: push pagination, filtering, and sorting to database queries; eliminate client memory catalog parsing. |
| **Phase 5** | `performance/phase-06-database` | Database audit: index verification, join optimizations, composite indexes for candidate search & status filtering. |
| **Phase 6** | `performance/phase-07-api-network` | Optimize API routes (`/api/partner/campuses`, `/api/jobs`, `/api/notifications`), eliminate duplicate roundtrips and bloated payloads. |
| **Phase 7** | `performance/phase-08-caching` | Implement safe `Cache-Control`, `stale-while-revalidate` for public/semi-static data without cross-tenant leakage. |
| **Phase 8** | `performance/phase-09-auth` | Streamline Supabase auth calls in middleware and `getCurrentAppUser`; avoid redundant remote token validations. |
| **Phase 9** | `performance/phase-10-assets` | Migrate raw `<img>` tags to `next/image`, add Unsplash domain to `next.config.ts`, responsive sizing for avatars/banners. |
| **Phase 10** | `performance/phase-11-bundle` | Code splitting: dynamic import for heavy admin components, CV/PDF tooling, canvas effects, and Lucide tree shaking. |
| **Phase 11** | `performance/phase-12-react-runtime` | React runtime profiling: eliminate redundant calculations, memoize stable callbacks and sets in search/recruiter tables. |
| **Phase 12** | `performance/phase-13-background-work` | Suspend polling intervals when document is hidden (`document.hidden`), use adaptive backoff. |
| **Phase 13** | `performance/phase-14-animation` | Optimize Hero canvas animation: throttle mousemove, ensure `IntersectionObserver` disconnects when scrolled out of view. |
| **Phase 14** | `performance/phase-15-storage` | Debounce and cache `localStorage` reads/writes; replace repeated `JSON.parse` with memory memoization. |
| **Phase 15** | `performance/phase-16-connections` | Database connection pooling validation for Supabase transaction pooler. |
| **Phase 16** | `performance/phase-17-final-audit` | System-wide benchmark re-run from clean `dev` baseline; before vs after comparison matrix. |

---

## 5. Verification Checklist

- [x] Baseline built on clean `dev` commit `72120e506f7b737516a179b807dd6475349ced5b`
- [x] Zero production application code altered during baseline creation
- [x] `npm run lint` passes (0 errors, 0 warnings)
- [x] `npm run typecheck` passes (0 errors)
- [x] `npm run test:unit` passes (95 tests, 18 suites passing)
- [x] `npm run build` succeeds (103 static/dynamic routes compiled)
- [x] Real production server benchmarked (`next start` on port 3001)
