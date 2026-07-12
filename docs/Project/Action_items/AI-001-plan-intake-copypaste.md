# AI-001 — Plan intake (copy-paste)

**Status:** ✅ Done · **Owning agents:** plan-parser, ai-integration

## Goal
Turn "Create your plan" into a working loop: generate the engineered prompt from
the user's profile, let them paste the AI's reply, parse it, review/confirm, save.

## What was built
- `src/lib/ai/prompt.ts` — `buildPrompt(profile, locale)` (strict-JSON prompt).
- `src/lib/parser/schema.ts` + `parse.ts` — Zod schema + tolerant parser
  (strips code fences, extracts `{…}`, validates; keeps raw text).
- `src/app/[locale]/plan/new/page.tsx` — 3-stage flow: prompt+copy → paste →
  review. Loads profile from Supabase (signed-in) or `localStorage` (trial).
- `src/components/PlanReviewForm.tsx` — editable, pre-filled review (day titles,
  exercise name/sets/reps/rest, add/remove), then approve.
- Save: writes `plans` + `plan_days` + `plan_exercises` (signed-in) or
  `localStorage` (trial); deactivates previous active plan; returns to dashboard.

## Verified
- Parser end-to-end on a fenced reply with chatter → correct; garbage rejected.
- Routes render (EN/繁中); `npm run build` green.

## Follow-ups (moved to later items)
- Rendering the saved plan (calendar/day view) → **AI-002**.
- Direct-API mode instead of copy-paste → **AI-004**.
