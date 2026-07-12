# AI-003 — UI design foundation (Energetic Fitness) + restyle

**Status:** ✅ Done (built by the frontend-ui agent) · **Owning agent:** frontend-ui

> **Verified:** `npm run typecheck` + `npm run build` green (incl. next/font
> Space Grotesk + Inter); all pages render (EN/繁中); brand tokens, theme
> no-flash script, and header present. Visual polish is subjective — user to
> review in the browser.

## Goal
Replace the bare black-and-white scaffolding with a cohesive, attractive design
system in an **Energetic Fitness** direction, and restyle every existing screen
to use it. Presentation only — do not change page logic, data flow, props, routes,
or i18n keys.

## Design direction: "Energetic Fitness"
Bold, motivating, gym/training-app energy. High contrast, confident type,
vibrant accent. Light + dark, dark-capable via a class toggle.

### Color tokens (add to `tailwind.config.ts` `theme.extend.colors`)
- `brand` (orange): DEFAULT `#FF5A1F`, hover `#E64A12`, tint `#FFF1EC`,
  plus a 50–900 ramp if convenient.
- `lime` (secondary accent): DEFAULT `#A3E635`, deep `#65A30D`, tint `#F3FBE3`.
- Neutrals: use Tailwind `neutral` for surfaces/text. Light surface `white` /
  `neutral-50`; dark surface `neutral-900` on page bg `neutral-950`.
- Semantic: success = lime/emerald, danger = `red-500`.

### Typography (next/font — this is the real app, external fonts are fine)
- Headings/display: **Space Grotesk** (sporty geometric). Body: **Inter**.
- Wire via `next/font/google` in the root/[locale] layout, expose as CSS vars
  (`--font-display`, `--font-sans`), map in `tailwind.config.ts` `fontFamily`
  (`display`, `sans`). Headings use `font-display font-bold tracking-tight`.

### Shape & depth
- Radius: cards `rounded-2xl`, controls `rounded-xl`, pills `rounded-full`.
- Subtle shadows on cards (`shadow-sm`, hover `shadow-md`), 150ms transitions.
- Accent details: use brand for primary actions and progress fills; lime for
  positive/complete states and small highlights. Avoid overusing both at once.

### Dark mode (IMPORTANT — currently broken)
`tailwind.config.ts` has `darkMode: 'class'`, but nothing ever adds `.dark`, so
`dark:` styles never activate. Implement a proper theme system:
- A `ThemeToggle` that toggles `.dark` on `document.documentElement`, persists to
  `localStorage`, and defaults from `prefers-color-scheme`.
- An inline no-flash script in the layout `<head>`/before content to set the
  class before paint.

## Components to build — `src/components/ui/`
Small, typed, reusable, both themes:
- `Button` (variants: `primary` = brand, `secondary`, `outline`, `ghost`;
  sizes sm/md/lg; disabled/loading states; focus ring in brand).
- `Card` (padded, rounded-2xl, border + subtle shadow).
- `Input`, `Textarea`, `Select`, `Field` (label + control + optional hint/error).
- `Badge` (variants for day types: workout = brand tint, rest = neutral,
  active_recovery = lime tint).
- `ProgressBar` (brand fill on neutral track; accepts done/total).
- `Checkbox` (custom, large tap target, lime check when done).
- `AppShell` + `Header`: sticky header with a wordmark/logo (e.g. a bold “💪
  Workout” lockup or a simple mark), and on the right: language switch (en /
  繁體中文), `ThemeToggle`, and auth state (Sign out when signed in). A
  consistent max-width content container.
- `LocaleSwitch` (switch locale while preserving the path via `usePathname`
  from `@/i18n/navigation`).

Refactor existing ad-hoc buttons/inputs to use these components.

## Screens to restyle (keep all logic/props/keys intact)
1. **Landing** (`[locale]/page.tsx`) — an energetic hero: big display headline,
   brand accent, clear CTA; the 3 how-it-works steps as cards.
2. **Login** — centered card, prominent Google button, trial link.
3. **Onboarding** — grouped, good-looking form using `Field`/`Select`/`Input`
   and a nicer unit toggle; keep the metric↔imperial behavior.
4. **Dashboard + `WeekCalendar`** — the hero screen. Attractive day cards
   (weekday + date, title, type `Badge`), a `ProgressBar` or ring per workout
   day, brand highlight for “today”. Keep the create-plan / complete-profile
   branches.
5. **`plan/new`** — prompt in a styled `Card` with a clear Copy button; paste
   area; the review form using the new form components.
6. **Day view (`DayWorkout`) + `ExerciseDetail`** — clean exercise rows with the
   custom `Checkbox`, `sets × reps`/rest, a day `ProgressBar`, tidy expandable
   detail. Keep the AI-003-image seam in `ExerciseDetail` (image comes in AI-004).

## Constraints
- Do not alter routing, data fetching, Supabase calls, parser, or i18n message
  keys. Add new keys only if you add genuinely new visible text, and update BOTH
  `messages/en.json` and `messages/zh-Hant.json` in sync.
- Mobile-first, responsive; the page body must never scroll horizontally.
- Keep it tasteful — not a rainbow. Brand orange is the star; lime is a garnish.

## Acceptance
- `npm run typecheck` and `npm run build` pass.
- All existing flows still work (sign-in, onboarding save, plan create, calendar,
  check-off) — presentation changed, behavior unchanged.
- Light and dark both look intentional; theme toggle + language switch work.
- Both locales render.

## Non-goals (later)
- Exercise image/GIF (AI-004). Animations beyond simple transitions, custom
  illustrations, and a marketing landing page can be a later polish pass.
