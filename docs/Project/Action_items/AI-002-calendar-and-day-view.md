# AI-002 — Calendar (week view) + day view + check-off

**Status:** ✅ Done (built by the calendar + workout-tracking agents) ·
**Owning agents:** calendar, workout-tracking

> **Verified:** `npm run typecheck` + `npm run build` green; day route and
> dashboard render (EN/繁中). Full check-off persistence E2E needs a signed-in
> browser session (verify manually).
>
> **Known follow-up (not a blocker):** trial (no-account) users currently can't
> reach the dashboard/calendar because `/dashboard` is auth-guarded and the
> trial flow redirects there. Fix belongs in the auth/trial slice: either route
> trial users to a trial-accessible calendar or relax the guard for trial.
> Links from the calendar to `/day/[date]` also don't propagate `?trial=1` yet.

## Goal
Render the saved active plan as the current week on the dashboard; clicking a day
opens that day's workout; each exercise can be checked **done** and the state
persists (per real date). This makes the dashboard show the plan and turns it into
actual tracking.

## Data model note (refinement)
A plan is a weekly template keyed by `day_index` (1=Mon … 7=Sun). Completion is
tracked per **real date**. So the calendar shows the **current week's dates**,
maps each date → the matching `plan_day.day_index`, and check-offs write
`completions` rows keyed by `(plan_exercise_id, date)`. Day view is therefore
routed by **date** (`/day/[date]`, `YYYY-MM-DD`), not by day_index.

## Tasks

### A. Shared plan queries — `src/lib/plans/queries.ts` (calendar agent creates; both use)
- `getActivePlan()` for signed-in (Supabase) → `{ plan, days, exercisesByDayId }`
  and a trial variant reading `localStorage` (`trialPlan` from AI-001).
- Helpers: `dayIndexFromDate(date)` (Mon=1…Sun=7), `currentWeekDates(ref?)` → 7
  ISO dates Mon→Sun, `isoDate(date)`.
- Export row types (`PlanDayRow`, `PlanExerciseRow`, `CompletionRow`).

### B. Week calendar on the dashboard — `calendar` agent
- Edit `src/app/[locale]/dashboard/page.tsx`: if an active plan exists, render
  `<WeekCalendar>`; else keep the existing "create plan" CTA. Keep the
  "complete profile" branch as-is.
- `src/components/WeekCalendar.tsx`: 7 day cards for the current week (localized
  weekday + date). Each card shows the plan_day title + a type badge
  (workout/rest/active_recovery). Workout days show completion `done/total` and
  link to `/day/[date]`; rest days are muted, not linked.
- Compute completion per date from `completions` (signed-in) or localStorage
  (trial).

### C. Day view — `workout-tracking` agent — `src/app/[locale]/day/[date]/page.tsx`
- Parse `date`, compute `day_index`, load that plan_day + its exercises via the
  shared queries. If the date is a rest day or there's no plan, show a friendly
  empty state.
- List exercises: name, `sets × reps`, rest; a **done** checkbox per exercise.
- Toggling writes/removes a `completions` row for `(plan_exercise_id, date)`
  (signed-in) or updates localStorage (trial). Optimistic UI; persists on refresh.
- Show a day completion progress bar (done/total).
- Clicking an exercise expands a lightweight `<ExerciseDetail>` showing `how_to`
  + primary muscle. (Full image/GIF popup is **AI-003**, exercise-library — leave
  a clean seam/placeholder, don't build the image here.)
- Back link to the dashboard.

### D. i18n — update BOTH `messages/en.json` and `messages/zh-Hant.json`
- Add `calendar.*` (weekday handling via next-intl formatting) and `day.*`
  (title, done, empty state, progress, back, exerciseDetail labels). Keep keys in
  sync across both catalogs; Traditional Chinese only.

## Files
- New: `src/lib/plans/queries.ts`, `src/components/WeekCalendar.tsx`,
  `src/app/[locale]/day/[date]/page.tsx`, `src/components/ExerciseDetail.tsx`.
- Edit: `src/app/[locale]/dashboard/page.tsx`, both message catalogs.

## Acceptance
- Signed-in user with a saved plan sees the current week on the dashboard;
  clicking a workout day shows its exercises; checking them persists across
  refresh; completion counts update on the calendar.
- Trial user (localStorage plan) gets the same experience with local persistence.
- `npm run typecheck` and `npm run build` pass; both locales render.

## Non-goals (later items)
- Exercise image/GIF popup → AI-003.
- Google Calendar sync, streaks/analytics, editing a saved plan.
