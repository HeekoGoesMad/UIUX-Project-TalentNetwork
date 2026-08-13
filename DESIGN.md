# Design System

This document defines the visual design system for the project. All new components and pages **must** follow these tokens, patterns, and conventions.

---

## Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS v4 (CSS-first config via `@theme inline` in `globals.css` — no `tailwind.config.ts`)
- **Components:** shadcn/ui (new-york style, neutral base)
- **Icons:** Lucide React
- **Fonts:** Plus Jakarta Sans + JetBrains Mono (mono) via `next/font/google`
- **Theme:** Light mode first; semantic tokens remain structured for future dark mode
- **Utilities:** `cn()` from `@/lib/utils` (clsx + tailwind-merge)

---

## Colors

All values use the **oklch** color space. Colors are defined as CSS custom properties in `globals.css` and bridged to Tailwind via `@theme inline`.

### ProofyLink Palette

The ProofyLink interface uses a vibrant primary purple CTA (`#7C3AED`), pink accent (`#EC4899`), clean light grayscale neutrals (`#F9FAFB` → `#111827`), and semantic status colors (`#10B981`, `#F59E0B`, `#EF4444`).

| Scale | Value | Usage |
| --- | --- | --- |
| `primary-purple` | `#7C3AED` | Ungu Primer - Main CTA buttons, active tabs, bullet points, active links |
| `pink-primary` | `#EC4899` | Pink Primer - Brand secondary accent, gradient highlights |
| `logo-gradient` | `#7C3AED` → `#EC4899` | Shield logo icon gradient (purple to pink) |
| `dark-navy` | `#201C45` | CTA banner background (footer section) |
| `page-bg` | `#F9FAFB` | Main page background (Grayscale 50) |
| `card-surface` | `#FFFFFF` | Card backgrounds and content containers |
| `border-hairline` | `#E5E7EB` | Hairline borders and dividers (Grayscale 200) |
| `heading-text` | `#111827` | Page headings and primary text (Grayscale 900) |
| `body-text` | `#4B5563` | Paragraphs, descriptions, secondary copy (Grayscale 600) |
| `danger-red` | `#EF4444` | Merah Kesalahan - Error states, critical warnings, "Risiko Tinggi" badge |
| `amber-warning` | `#F59E0B` | Kuning Peringatan - Warning states, "Sensitif", "Perlu Klarifikasi" badges |
| `success-green` | `#10B981` | Hijau Sukses - Success states, verified badges, "Low" risk indicators |
| `info-blue-tint` | `#EFF6FF` | Financial profile & info highlight background |

### Semantic Tokens

| Token                    | Light                          | Usage                         |
| ------------------------ | ------------------------------ | ----------------------------- |
| `background`           | `#F9FAFB`                    | Workspace background          |
| `foreground`           | `#111827`                    | Primary text                  |
| `primary`              | `#7C3AED`                    | Buttons, links, accents       |
| `primary-foreground`   | `#FFFFFF`                    | Text on primary               |
| `secondary`            | `#F3E8FF`                    | Secondary buttons, subtle bg  |
| `secondary-foreground` | `#7C3AED`                    | Text on secondary             |
| `muted`                | `#F3F4F6`                    | Subdued backgrounds           |
| `muted-foreground`     | `#4B5563`                    | Subdued text, placeholders    |
| `accent`               | `#F3E8FF`                    | Hover backgrounds, highlights |
| `accent-foreground`    | `#7C3AED`                    | Text on accent                |
| `destructive`          | `#EF4444`                    | Error states, delete actions  |
| `card`                 | `#FFFFFF`                    | Card backgrounds              |
| `card-foreground`      | `#111827`                    | Card text                     |
| `popover`              | `#FFFFFF`                    | Popover/dropdown bg           |
| `popover-foreground`   | `#111827`                    | Popover/dropdown text         |
| `border`               | `#E5E7EB`                    | Borders, dividers             |
| `input`                | `#E5E7EB`                    | Input borders                 |
| `ring`                 | `#7C3AED`                    | Focus rings                   |

### Chart Colors

| Token       | Light                         | Dark                           |
| ----------- | ----------------------------- | ------------------------------ |
| `chart-1` | `oklch(0.646 0.222 41.116)` | `oklch(0.488 0.243 264.376)` |
| `chart-2` | `oklch(0.6 0.118 184.704)`  | `oklch(0.696 0.17 162.48)`   |
| `chart-3` | `oklch(0.398 0.07 227.392)` | `oklch(0.769 0.188 70.08)`   |
| `chart-4` | `oklch(0.828 0.189 84.429)` | `oklch(0.627 0.265 303.9)`   |
| `chart-5` | `oklch(0.769 0.188 70.08)`  | `oklch(0.645 0.246 16.439)`  |

### Sidebar Colors

| Token                          | Light                          | Dark                           |
| ------------------------------ | ------------------------------ | ------------------------------ |
| `sidebar`                    | `oklch(0.985 0 0)`           | `oklch(0.21 0.006 285.885)`  |
| `sidebar-foreground`         | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)`           |
| `sidebar-primary`            | `oklch(0.21 0.006 285.885)`  | `oklch(0.488 0.243 264.376)` |
| `sidebar-primary-foreground` | `oklch(0.985 0 0)`           | `oklch(0.985 0 0)`           |
| `sidebar-accent`             | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` |
| `sidebar-accent-foreground`  | `oklch(0.21 0.006 285.885)`  | `oklch(0.985 0 0)`           |
| `sidebar-border`             | `oklch(0.92 0.004 286.32)`   | `oklch(1 0 0 / 10%)`         |
| `sidebar-ring`               | `oklch(0.705 0.015 286.067)` | `oklch(0.552 0.016 285.938)` |

### Ad-hoc Status Colors

Use these Tailwind utilities or CSS tokens for status indicators:

- **Success:** `text-emerald-500` / `#10B981`, `bg-emerald-50`
- **Warning:** `text-amber-500` / `#F59E0B`, `bg-amber-50`
- **Error:** `text-red-500` / `#EF4444`, `bg-red-50`, `text-destructive`

---

## Typography

### Font Families

| Token                  | Font        | Usage                         |
| ---------------------- | ----------- | ----------------------------- |
| `--font-jakarta`   | Plus Jakarta Sans | Brand, interface, forms, headings, and body copy |
| `--font-jetbrains` | JetBrains Mono   | Token counts, metrics, timestamps, and technical metadata |

Body has `font-feature-settings: "rlig" 1, "calt" 1` and `antialiased` enabled.

### Type Scale

| Class         | Size | Usage                                              |
| ------------- | ---- | -------------------------------------------------- |
| `text-xs`   | 12px | Timestamps, shortcuts, helper text, code           |
| `text-sm`   | 14px | Descriptions, labels, body copy, card descriptions |
| `text-base` | 16px | Base text, inputs (mobile)                         |
| `text-lg`   | 18px | Dialog titles, sub-headings                        |
| `text-xl`   | 20px | Section titles, header logo                        |
| `text-2xl`  | 24px | Page titles, card titles                           |
| `text-3xl`  | 30px | Dashboard/profile headings                         |
| `text-4xl`  | 36px | Large display text                                 |
| `text-5xl`  | 48px | Hero title                                         |

### Font Weights

| Class             | Weight | Usage                                                |
| ----------------- | ------ | ---------------------------------------------------- |
| `font-medium`   | 500    | Buttons, labels, nav items                           |
| `font-semibold` | 600    | Card titles, section headings, badges, dialog titles |
| `font-bold`     | 700    | Page titles, hero heading                            |

### Line Heights & Tracking

| Class               | Usage                 |
| ------------------- | --------------------- |
| `leading-none`    | Labels, card titles   |
| `leading-5`       | Code blocks           |
| `leading-6`       | List items            |
| `leading-7`       | Paragraphs (markdown) |
| `tracking-tight`  | Hero/display text     |
| `tracking-widest` | Keyboard shortcuts    |

---

## Spacing

### Container Pattern

```
container mx-auto px-4
```

Responsive overrides where needed:

- Header: `px-3 sm:px-4`
- Footer: `px-4 sm:px-6 lg:px-8`

### Max Widths

| Class         | Value | Usage                             |
| ------------- | ----- | --------------------------------- |
| `max-w-sm`  | 24rem | Auth forms                        |
| `max-w-md`  | 28rem | Login/register cards, error pages |
| `max-w-lg`  | 32rem | Dialog content (sm+)              |
| `max-w-2xl` | 42rem | Large dialogs                     |
| `max-w-3xl` | 48rem | Embeds, protected state           |
| `max-w-4xl` | 56rem | Main content pages                |

### Vertical Spacing (space-y)

| Class           | Usage                           |
| --------------- | ------------------------------- |
| `space-y-1`   | Tight lists, inline stacks      |
| `space-y-1.5` | Card header                     |
| `space-y-2`   | Form field groups, small stacks |
| `space-y-3`   | Footer stacks                   |
| `space-y-4`   | Form sections, dialog content   |
| `space-y-6`   | Card content sections           |
| `space-y-8`   | Page-level sections             |

### Padding

| Class   | Usage                                  |
| ------- | -------------------------------------- |
| `p-1` | Dropdown content, icon buttons         |
| `p-2` | Code blocks, muted backgrounds         |
| `p-3` | Chat bubbles, inputs                   |
| `p-4` | Grid items, action buttons, list items |
| `p-6` | Cards, dialog content                  |

### Page Vertical Padding

| Class            | Usage                  |
| ---------------- | ---------------------- |
| `py-3 sm:py-4` | Header                 |
| `py-4 sm:py-6` | Footer                 |
| `py-8`         | Standard content pages |
| `py-12`        | Home page, dashboard   |
| `py-16`        | Error/not-found pages  |

---

## Border Radius

| Token           | Value                           | Class            |
| --------------- | ------------------------------- | ---------------- |
| `--radius`    | `0.625rem` (10px)             | Base             |
| `--radius-sm` | `calc(--radius - 4px)` = 6px  | `rounded-sm`   |
| `--radius-md` | `calc(--radius - 2px)` = 8px  | `rounded-md`   |
| `--radius-lg` | `var(--radius)` = 10px        | `rounded-lg`   |
| `--radius-xl` | `calc(--radius + 4px)` = 14px | `rounded-xl`   |
| —              | 9999px                          | `rounded-full` |

**Usage:**

- `rounded-md` — Buttons, inputs, textarea, code blocks, dropdowns
- `rounded-lg` — Cards, dialogs, feature cards, chat bubbles
- `rounded-xl` — Hero logo container
- `rounded-full` — Badges, avatars

---

## Shadows

| Class         | Usage                                       |
| ------------- | ------------------------------------------- |
| `shadow-xs` | Inputs, textarea, secondary/outline buttons |
| `shadow-sm` | Card base                                   |
| `shadow-md` | Card hover, dropdown content                |
| `shadow-lg` | Dialogs, dropdown sub-content               |

No custom shadow definitions — all Tailwind defaults.

---

## Animations

### Custom Keyframes

| Name         | Effect                                | Duration | Easing   |
| ------------ | ------------------------------------- | -------- | -------- |
| `fade-in`  | Opacity 0 → 1                        | 0.3s     | ease-out |
| `fade-up`  | Opacity 0 → 1 + translateY(8px → 0) | 0.4s     | ease-out |
| `scale-in` | Opacity 0 → 1 + scale(0.97 → 1)     | 0.2s     | ease-out |

Use via: `animate-fade-in`, `animate-fade-up`, `animate-scale-in`

### tw-animate-css Animations

Used on dialogs and dropdowns:

- `animate-in` / `animate-out`
- `fade-in-0` / `fade-out-0`
- `zoom-in-95` / `zoom-out-95`
- `slide-in-from-{top|bottom|left|right}-2`

### Transition Classes

| Class                             | Usage                           |
| --------------------------------- | ------------------------------- |
| `transition-colors`             | Links, hover color changes      |
| `transition-opacity`            | Avatar hover, reveal-on-hover   |
| `transition-all duration-200`   | Card interactive hover, buttons |
| `transition-[color,box-shadow]` | Input/textarea focus            |

### Utility Classes

```css
.card-interactive {
  @apply transition-all duration-200 ease-out;
}
.card-interactive:hover {
  @apply shadow-md -translate-y-0.5;
}
```

```css
.auth-bg {
  background-image: radial-gradient(
    circle at 50% 0%,
    var(--accent) 0%,
    transparent 50%
  );
}
```

---

## Layout

### Root Structure

```
<body class="antialiased min-h-screen flex flex-col">
  <SiteHeader />
  <main id="main-content" class="flex-1">{children}</main>
  <SiteFooter />
  <Toaster />
</body>
```

### Page Layout Patterns

**Auth pages:**

```
flex min-h-[calc(100vh-4rem)] items-center justify-center p-4
  → Card w-full max-w-md
```

**Standard content pages:**

```
container mx-auto px-4 py-8
  → max-w-4xl mx-auto
```

**Error/not-found pages:**

```
container mx-auto px-4 py-16
  → max-w-md mx-auto text-center
```

### Grid Patterns

| Pattern                                                  | Usage                 |
| -------------------------------------------------------- | --------------------- |
| `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` | Feature cards (4-col) |
| `grid grid-cols-1 md:grid-cols-2 gap-6`                | Dashboard cards       |
| `grid grid-cols-1 md:grid-cols-2 gap-4`                | Profile info          |
| `grid grid-cols-1 md:grid-cols-3 gap-4`                | Quick actions         |

### Responsive Breakpoints

Standard Tailwind breakpoints:

- `sm:` (640px) — Padding adjustments, text alignment, button sizing
- `md:` (768px) — Grid column changes (→ 2 col), input font size
- `lg:` (1024px) — Grid column changes (→ 4 col), wide padding

---

## Icons

**Library:** Lucide React

### Sizing Convention

| Size    | Classes                   | Usage                           |
| ------- | ------------------------- | ------------------------------- |
| XS      | `h-3 w-3`               | Inline badge icons              |
| SM      | `h-3.5 w-3.5`           | Copy buttons                    |
| Default | `h-4 w-4` or `size-4` | Standard UI icons               |
| MD      | `h-5 w-5`               | Header logo icon                |
| LG      | `h-7 w-7`               | Hero logo icon                  |
| XL      | `h-16 w-16`             | Error/empty state illustrations |

### Commonly Used Icons

`Bot`, `User`, `Lock`, `Shield`, `Mail`, `Calendar`, `Copy`, `Check`, `Loader2`, `LogOut`, `Sun`, `Moon`, `Github`, `ArrowLeft`, `RefreshCw`, `AlertCircle`, `FileQuestion`, `Database`, `Palette`, `Video`

---

## Components (shadcn/ui)

All components live in `src/components/ui/`. They use `data-slot` attributes, accept `className` for overrides via `cn()`, and follow either `React.forwardRef` or functional component patterns.

### Button

6 variants, 4 sizes (CVA-based):

| Variant         | Usage                 |
| --------------- | --------------------- |
| `default`     | Primary actions       |
| `secondary`   | Secondary actions     |
| `outline`     | Tertiary actions      |
| `ghost`       | Subtle/icon actions   |
| `destructive` | Delete/danger actions |
| `link`        | Inline text links     |

| Size        | Height | Padding |
| ----------- | ------ | ------- |
| `sm`      | h-8    | px-3    |
| `default` | h-9    | px-4    |
| `lg`      | h-10   | px-6    |
| `icon`    | size-9 | —      |

### Card

6 sub-components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

Base: `rounded-lg border bg-card text-card-foreground shadow-sm`

### Input / Textarea

- Height: `h-9` (input), `min-h-16` (textarea)
- Border: `border bg-transparent rounded-md shadow-xs`
- Focus: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Validation: `aria-invalid:border-destructive aria-invalid:ring-destructive/20`
- Responsive font: `text-base md:text-sm`

### Badge

4 variants: `default`, `secondary`, `destructive`, `outline`

Base: `rounded-full border px-2.5 py-0.5 text-xs font-semibold`

### Dialog

Radix-based with overlay (`bg-black/50`), fade + zoom animations, optional close button.

### DropdownMenu

Radix-based. Content: `rounded-md border p-1 shadow-md min-w-[8rem]`. Items support a `destructive` variant.

### Spinner

Sizes: `sm` (h-4 w-4), `md` (h-6 w-6), `lg` (h-8 w-8). Uses `Loader2` with `animate-spin`.
```

Component-level override:

```
focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

### Disabled

```
disabled:pointer-events-none disabled:opacity-50
```

### Interactive Card Hover

```
transition-all duration-200 ease-out
hover:shadow-md hover:-translate-y-0.5
```

---

## Theme Strategy

- **Current release:** Light mode only, using the ProofyLink semantic token structure.
- **Deferred:** Dark mode and `next-themes` activation remain a future task.
- Avoid hard-coding dark-mode assumptions into components so the palette can be extended later.

## Language

- Indonesian is the primary product language.
- Use English for common technical labels such as `AI Summary`, `Dashboard`, `Token`, `Profile`, `Search`, `Portfolio`, and `Verified Talent` when that is clearer for users.

### AI, CV, and Screening Rules

- Label generated copy as `AI draft` and always show `Source`, `Model version`, `Data coverage`, and `Limitations` near the result.
- CV import is `PDF only`; extraction is a suggestion. Every imported field must remain editable before `Simpan profile`.
- Use a single-column, high-contrast ATS preview for export. Show a preview action before download and include generated date and CV version.
- Screening is a consent-first flow: show the candidate, purpose, state, and one-token cost before the action. Consent states use plain Indonesian copy and are never implied by profile visibility.
- Screening insight may discuss data quality and role fit only. Never display salary, financial, credit, protected-attribute, or automated hire/reject conclusions.
- Use navy for structure, emerald for consent/trust/success, amber for review-needed states, and red only for blocking errors. Do not communicate meaning through color alone.
- Minimum contrast is WCAG AA: 4.5:1 for normal text and 3:1 for large text or UI boundaries. Focus rings remain visible on every interactive control.

---

## Branding

### Logo Text

```
bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent
```

### Logo Icon Container		

```
w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center
```

Hero variant: `w-12 h-12 rounded-xl`

---

## Verified UI/UX QA

The following checks were run against the Next.js development server using Playwright at desktop and mobile viewport sizes.

### Verified flows

- Public landing page renders with ProofyLink navy grid, emerald CTA, responsive network preview, and footer navigation.
- Recruiter login reaches `/dashboard` and persists the demo session across navigation.
- Candidate login reaches `/profile` and exposes Profile, Jobs, and Messages navigation.
- Role-protected routes wait for LocalStorage hydration before redirecting.
- Search renders 30 candidates, URL-backed filters, mobile filter dialog, sort controls, grid/list controls, and numbered pagination.
- Candidate profile scan confirmation opens correctly.
- First profile scan deducts exactly one token and reveals contact details.
- Repeat visits do not deduct another token.
- Shortlist toggling persists to LocalStorage.
- Private shortlist notes save on blur.
- Jobs and Messages render polished placeholder states without console errors.
- No console errors were observed during the final smoke pass.

### Accessibility and interaction requirements

- Root layout includes a keyboard-accessible skip link to `#main-content`.
- Icon-only controls require an accessible `aria-label`.
- Role selectors expose `aria-pressed` state.
- Form controls use meaningful `id`, `name`, `autocomplete`, and input types.
- Email fields disable spellcheck; password fields use the appropriate authentication autocomplete value.
- Loading regions use `role="status"` and visible loading copy where appropriate.
- Buttons, links, and selects use visible `focus-visible` styles.
- Interactive controls use `touch-action: manipulation` for responsive touch behavior.
- Reduced-motion behavior remains enabled through the global media query.

### Remaining test boundaries

- Authentication, token purchases, jobs, and messaging are demo-only and require backend integration tests when services are added.
- CSV export should be manually verified in a browser download context when release packaging is tested.
- Visual regression screenshots should be added once the final production data and copy are available.
