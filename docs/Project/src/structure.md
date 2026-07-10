# Workout Tracker — Technical Structure

> This document defines **how** the app is built: stack, folder layout, database
> schema, API/routes, component tree, i18n, exercise-library integration, AI
> adapters, and deployment. It implements the concept in
> `docs/Project/concept.md`. Read that first for the "what & why".

---

## 1. Stack & Key Libraries

| Concern | Choice |
|---------|--------|
| Framework | **Next.js (App Router, TypeScript, React)** |
| Hosting (frontend + serverless) | **Vercel** free tier |
| DB / Auth / Storage | **Supabase** (Postgres + Auth + Storage), free tier |
| Auth provider | Supabase Auth with **Google OAuth** |
| Styling | **Tailwind CSS** + a small component set (e.g. shadcn/ui) |
| i18n | **next-intl** (locale-prefixed routes) |
| Validation | **Zod** (parse & validate AI JSON, forms) |
| Data fetching/cache | React Server Components + **TanStack Query** for client mutations |
| Charts (later phases) | **Recharts** |
| Exercise data | **free-exercise-db** (public domain), hot-linked images |
| Token encryption | Node `crypto` (AES-256-GCM) with a server-only key |
| Cron keep-alive | **GitHub Actions** scheduled workflow |

Node version pinned via `.nvmrc`. Package manager: `pnpm` (or npm — pick one and pin).

---

## 2. Repository Layout

```
my-workout-app/
├─ docs/Project/…                     # concept.md, src/structure.md
├─ .claude/agents/…                   # section agents (see §12)
├─ .github/workflows/keepalive.yml    # cron ping to keep Supabase awake
├─ messages/                          # i18n translation catalogs
│  ├─ en.json
│  └─ zh-Hant.json
├─ public/                            # static assets, muscle diagrams (fallback)
├─ supabase/
│  ├─ migrations/                     # SQL migrations (schema + RLS)
│  └─ config.toml
├─ src/
│  ├─ app/
│  │  ├─ [locale]/                    # all user-facing pages are locale-prefixed
│  │  │  ├─ layout.tsx                # locale provider, theme, nav
│  │  │  ├─ page.tsx                  # landing / marketing
│  │  │  ├─ login/page.tsx            # Google sign-in + "continue without account"
│  │  │  ├─ onboarding/page.tsx       # profile form (goal, sex, metrics, days…)
│  │  │  ├─ dashboard/page.tsx        # calendar-style week view
│  │  │  ├─ plan/
│  │  │  │  ├─ new/page.tsx           # prompt gen → copy-paste OR API → review/confirm
│  │  │  │  └─ [planId]/page.tsx      # a saved plan overview
│  │  │  ├─ day/[dayIndex]/page.tsx   # a single day's workout + check-off
│  │  │  └─ settings/page.tsx         # language, units, AI provider + token, account
│  │  ├─ api/
│  │  │  ├─ ai/generate/route.ts      # direct-API mode: server calls user's provider
│  │  │  ├─ plan/parse/route.ts       # parse+validate raw AI text → structured JSON
│  │  │  ├─ keepalive/route.ts        # cron hits this; touches DB
│  │  │  └─ auth/callback/route.ts    # Supabase OAuth callback
│  │  └─ globals.css
│  ├─ components/                     # shared UI (see §8 component tree)
│  ├─ lib/
│  │  ├─ supabase/                    # browser client, server client, middleware
│  │  ├─ ai/                          # provider adapters + prompt builder
│  │  │  ├─ providers/                # gemini.ts, openai.ts, anthropic.ts
│  │  │  ├─ prompt.ts                 # buildPrompt(profile, locale)
│  │  │  └─ index.ts                  # provider registry + guided-setup metadata
│  │  ├─ parser/
│  │  │  ├─ schema.ts                 # Zod schema for the plan JSON
│  │  │  └─ parse.ts                  # tolerant parse (strip fences, extract {…})
│  │  ├─ exercises/
│  │  │  ├─ match.ts                  # canonical_id/name → free-exercise-db entry
│  │  │  └─ aliases.ts                # synonym table for naming differences
│  │  ├─ units/                       # metric↔imperial conversion + formatting
│  │  ├─ i18n/                        # next-intl config, locale detection
│  │  ├─ crypto/token.ts             # encrypt/decrypt AI tokens (AES-256-GCM)
│  │  └─ trial/                       # local-only (no-account) storage + migration
│  ├─ types/                          # shared TS types
│  └─ styles/
├─ .env.local.example
├─ next.config.js
├─ tailwind.config.ts
├─ package.json
└─ .nvmrc
```

---

## 3. Database Schema (Supabase / Postgres)

All tables use **Row Level Security (RLS)**: a row is readable/writable only when
`user_id = auth.uid()`. `profiles.id` references `auth.users.id`.

```sql
-- 3.1 profiles: one row per user
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  goal          text,                 -- e.g. 'recomp', 'fat_loss', 'muscle_gain'
  sex           text,                 -- 'male' | 'female' | 'other'
  age           int,
  height_cm     numeric,
  weight_kg     numeric,
  days_per_week int,
  session_minutes int,
  experience    text,                 -- 'beginner' | 'intermediate' | 'advanced'
  equipment     text,                 -- 'gym' | 'home_dumbbells' | 'bodyweight'
  limitations   text,                 -- free text, or 'none'
  locale        text default 'en',    -- 'en' | 'zh-Hant'
  unit_system   text default 'metric',-- 'metric' | 'imperial'
  preferred_provider text,            -- 'gemini' | 'openai' | 'anthropic' | null
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 3.2 ai_credentials: optional, encrypted at rest
create table ai_credentials (
  user_id       uuid references auth.users(id) on delete cascade,
  provider      text not null,
  token_cipher  text not null,        -- AES-256-GCM ciphertext (never plaintext)
  token_iv      text not null,
  token_tag     text not null,
  created_at    timestamptz default now(),
  primary key (user_id, provider)
);

-- 3.3 plans: raw + parsed
create table plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  source        text,                 -- 'paste' | 'api'
  raw_response  text,                 -- exact AI text, for re-parse/debug
  parsed        jsonb,                -- validated plan JSON (plan_meta+week+…)
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- 3.4 plan_days: normalized from parsed.week for querying
create table plan_days (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid references plans(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete cascade,
  day_index     int,                  -- 1=Mon … 7=Sun
  title         text,
  type          text,                 -- 'workout' | 'rest' | 'active_recovery'
  focus         text[],
  estimated_minutes int
);

-- 3.5 plan_exercises: normalized, drives check-off + demo popup
create table plan_exercises (
  id             uuid primary key default gen_random_uuid(),
  plan_day_id    uuid references plan_days(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete cascade,
  ord            int,                 -- ordering within the day
  name           text,
  canonical_id   text,
  primary_muscle text,
  sets           int,
  reps           text,
  rest_sec       int,
  how_to         text,
  notes          text,
  library_id     text                 -- matched free-exercise-db id, or null
);

-- 3.6 completions: per-exercise, per-date check-offs
create table completions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  plan_exercise_id uuid references plan_exercises(id) on delete cascade,
  date             date not null,
  done             boolean default true,
  done_at          timestamptz default now(),
  unique (plan_exercise_id, date)
);

-- 3.7 LATER PHASES (create when built) --------------------------------
-- body_metrics(user_id, date, weight_kg, body_fat, notes)      -- analytics
-- food_logs(user_id, date, item, calories, source)             -- nutrition
-- calendar_links(user_id, provider, refresh_token_cipher, …)   -- gcal sync
```

**Design note:** `plans.parsed` keeps the whole validated JSON (single source of
truth); `plan_days`/`plan_exercises` are the normalized projection used for the
calendar, day view, and completion tracking. On approve in the review step we
write both.

---

## 4. Auth & Trial Mode

- **Google sign-in** via Supabase Auth. Callback handled at
  `api/auth/callback/route.ts`; session in cookies (Supabase SSR helpers).
- **Route protection** via `middleware.ts`: unauthenticated users can reach
  landing, login, and **trial** flows; account pages require a session.
- **Trial mode (no account):** profile + generated plan + check-offs are stored
  in the browser (`lib/trial/`, IndexedDB). A persistent "Sign in to save your
  progress" banner; on first sign-in we **migrate** local data into the account
  tables, then clear local storage.

---

## 5. AI Integration (`lib/ai/`)

### 5.1 Provider registry
`index.ts` exports a registry describing each supported provider:
```ts
{ id, label, freeTier: boolean,
  setupSteps: LocalizedSteps,   // "how to get your token", EN + zh-Hant
  tokenHint, docsUrl }
```
Used by the settings UI to render the **guided token setup** for whichever
provider the user picks (Gemini highlighted as having a free tier).

### 5.2 Adapters
`providers/{gemini,openai,anthropic}.ts` each implement:
```ts
generatePlan(prompt: string, token: string): Promise<string>  // returns raw text
```
Called **only server-side** from `api/ai/generate/route.ts` so the token never
reaches other clients. Token is loaded, decrypted (`lib/crypto/token.ts`), used,
discarded.

### 5.3 Prompt builder
`prompt.ts` → `buildPrompt(profile, locale)` fills the engineered template from
concept §7.1, localizing instructions to EN or 繁中 while keeping JSON keys English.

---

## 6. Parsing, Validation & Review/Confirm (`lib/parser/`)

1. `parse.ts` — tolerant intake (concept §7.3): strip ``` fences, slice first `{`
   to last `}`, `JSON.parse`.
2. `schema.ts` — **Zod** schema mirroring concept §7.1; `.safeParse` yields typed
   data + per-field issues.
3. **Review/confirm UI** (`plan/new`): parsed values pre-fill an editable form.
   - Fields the parser couldn't fill are shown empty/flagged.
   - User edits or approves.
   - On approve → write `plans` (raw + parsed) and the normalized
     `plan_days`/`plan_exercises`.
4. Both **copy-paste** and **direct-API** modes converge on this same review step.

---

## 7. Exercise Library Matching (`lib/exercises/`)

- Ship a snapshot of `free-exercise-db` metadata (JSON) in the app (small; images
  stay remote). At plan-approve time, `match.ts` resolves each exercise:
  1. exact `canonical_id`/name match → 2. normalized match → 3. alias table
  (`aliases.ts`) → else `library_id = null`.
- **Demo popup** renders: how-to `instructions` + hot-linked image
  (`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<path>`,
  optionally via jsDelivr) + primary/secondary muscles.
- **Fallbacks** (concept §7.4): muscle-group diagram/label from `public/`, then
  the AI's `how_to` text alone.

---

## 8. Component Tree (key components)

```
<AppShell>                         # nav, locale switcher, units toggle, auth state
├─ <LandingPage>
├─ <LoginPanel>                    # Google button + "continue without account"
├─ <ProfileForm>                   # onboarding + settings; unit-aware inputs
├─ <PlanIntake>                    # plan/new
│  ├─ <PromptCard>                 # shows generated prompt + copy button
│  ├─ <ProviderSetup>             # guided token steps for chosen provider
│  ├─ <ResponsePaste>             # textarea for copy-paste mode
│  └─ <PlanReviewForm>            # pre-filled editable parsed plan → approve
├─ <WeekCalendar>                  # dashboard; marks workout days, completion %
├─ <DayView>                       # day/[dayIndex]
│  ├─ <ExerciseRow>               # sets/reps/rest + done checkbox
│  └─ <ExerciseDetailModal>       # how-to + image/gif + muscle
├─ <SettingsPanel>                 # language, units, provider+token, delete data
└─ <UnitValue> / <LocaleSwitch>    # shared primitives
```

---

## 9. Internationalization (`lib/i18n/`, `messages/`)

- **next-intl** with locale-prefixed routes: `/[locale]/…` where locale ∈
  `en | zh-Hant`. Default detected from browser, fallback `en`.
- All copy lives in `messages/en.json` and `messages/zh-Hant.json` — no hardcoded
  strings.
- Locale drives: UI copy, prompt template language, date/number formatting.
- JSON plan keys stay English regardless of locale.

---

## 10. Units (`lib/units/`)

- `unit_system` per profile (`metric` default) + a global toggle.
- Storage is **always metric** (kg, cm); conversion is display-only.
- `convert()` + `format()` helpers; `<UnitValue>` renders weight/height/distance
  in the active system. Prompt sends metric with the system noted.

---

## 11. Deployment & Keep-Alive

- **Vercel:** connect repo, set env vars (§ below), auto-deploy on push to `main`.
- **Supabase:** project holds Postgres + Auth (Google OAuth configured) + Storage.
  Migrations in `supabase/migrations/` applied via Supabase CLI.
- **Keep-alive:** `.github/workflows/keepalive.yml` runs on a cron (e.g. every 3
  days), `curl`s `/api/keepalive`, which does a trivial DB read/write so the free
  tier never idles into pause.

**Env vars (`.env.local.example`):**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
TOKEN_ENC_KEY=                    # 32-byte key for AES-256-GCM (server only)
NEXT_PUBLIC_SITE_URL=
```

---

## 12. Section Agents (`.claude/agents/`)

Each project section has a dedicated agent that owns its files and follows these
two docs. See the agent files for scope. Summary:

| Agent | Owns |
|-------|------|
| `db-supabase` | schema, migrations, RLS, Supabase config |
| `auth` | Google sign-in, sessions, middleware, trial mode + migration |
| `ai-integration` | provider adapters, registry, prompt builder, token crypto |
| `plan-parser` | tolerant parse, Zod schema, review/confirm mapping |
| `exercise-library` | free-exercise-db snapshot, matching, demo popup |
| `calendar` | week calendar view, day scheduling (+ future gcal sync) |
| `workout-tracking` | day view, check-off, completion logging |
| `i18n-units` | next-intl catalogs, locale switch, metric↔imperial |
| `frontend-ui` | AppShell, design system, shared components, theming |
| `devops` | Vercel/Supabase deploy, env, GitHub Actions keep-alive |
| `nutrition` (later) | food logging, rough calorie estimate, photo→calorie |
| `analytics` (later) | progress plots, weekly/monthly check-ins |

---

## 13. Build Order (suggested)

1. `db-supabase` (schema+RLS) + `auth` (sign-in, trial) — foundation.
2. `i18n-units` + `frontend-ui` — shell everything renders in.
3. `ai-integration` + `plan-parser` — prompt → plan → review/confirm.
4. `exercise-library` — matching + demo popup.
5. `calendar` + `workout-tracking` — view + check-off.
6. `devops` — deploy + keep-alive.
7. Later phases: `nutrition`, `analytics`, Google Calendar sync.
```
