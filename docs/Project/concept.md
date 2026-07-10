# Workout Tracker — Project Concept

> This document defines **what** we are building and **why**. It is the single
> source of truth for the product concept. The technical structure (folders,
> data model, components, APIs) lives in `docs/Project/src/structure.md`.

---

## 1. Vision (one paragraph)

A free, always-on web app that helps a user build and follow a personalized
weekly workout plan. The user does **not** need to know how to design a
program — they answer a few questions, the app generates a well-engineered
prompt, and an AI (either the user's own AI account via copy-paste, or the
user's own API token) produces a structured plan. The app parses that plan,
shows it on a calendar, and lets the user tick off exercises, view
demonstration GIFs, and track progress over time.

---

## 2. Goals & Non-Goals

### Goals (v1)
- Bilingual UI: **English** and **Traditional Chinese (繁體中文)**, user-selectable.
- Account creation + login (Google sign-in).
- Collect user profile (goal, sex, age, height, weight, days/week, hours/session, etc.).
- Generate an **engineered AI prompt** from that profile.
- Two ways to get a plan:
  1. **Copy-paste mode** (default, zero cost): user pastes the prompt into their
     own AI chat, copies the answer back into our app.
  2. **Direct API mode** (optional): user chooses their AI provider, follows our
     guided steps to get an API token, pastes it, and the app calls the AI for them.
- Parse the AI response into structured workout data.
- Display the plan on a **calendar-style view**.
- Click a day → see that day's workout.
- Each exercise: check it off as **done**; click to open a detail popup with a
  **demonstration image/GIF** and target muscle.
- Track completion across days.

### Non-Goals (v1 — placeholders for later phases)
- Google Calendar two-way sync (data model will support it; feature comes later).
- Accurate calorie tracking from food photos (premium/paid AI feature — later).
- Advanced analytics dashboards (basic tracking now, rich plots later).
- Native mobile apps (responsive web only).
- Social / sharing features.

---

## 3. Target User

- Beginner-to-intermediate people who want to lose fat and/or gain muscle.
- Not necessarily technical. The app must guide them at every step
  (including how to get an AI API token).
- English- and Traditional-Chinese-speaking users.
- Uses **metric units** by default (kg, cm); imperial toggle is a nice-to-have.

---

## 4. Foundational Decisions (locked)

| Area | Decision | Notes |
|------|----------|-------|
| Frontend | **Next.js (React)** hosted on **Vercel** free tier | Always-on, free, standard. |
| Backend / DB / Auth | **Supabase** (Postgres + Auth + Storage) free tier | Free tier can pause after ~1 week of zero activity — we add a lightweight keep-alive (see §10). |
| Auth | **Google sign-in** | One click; eases future Google Calendar integration. |
| i18n | English + Traditional Chinese, user-selectable | See §9. |
| AI integration | **User brings their own** provider + token; app guides token setup. Copy-paste fallback always available. | See §6–7. |
| Google Calendar | Placeholder in v1; data model designed to support it | See §8. |
| Cost | 100% free tiers, runs 24/7 | See §10. |

---

## 5. Core User Flow (v1)

```
1. Sign in with Google
2. First-time setup: fill profile
   (goal, sex, age, height cm, weight kg, days/week, hours/session,
    experience level, equipment: gym vs home, injuries/limitations)
3. App generates the engineered prompt (localized EN / 繁中)
4. User chooses how to get their plan:
   ├─ Copy-paste mode: copy prompt → paste in own AI → paste answer back
   └─ Direct API mode: pick provider → follow guided token steps →
        paste token → app calls AI
5. App parses the AI answer into structured plan data
6. Review & confirm: because each AI reply can differ slightly, the parsed
   values PRE-FILL an editable form. Anything the AI missed is shown as empty
   for the user to fill; the user can edit anything, or simply APPROVE as-is.
   On approve → the plan is saved.
7. Calendar view shows the week; workout days are marked
8. User clicks a day → sees that day's workout
9. For each exercise: check "done"; click exercise → popup with how-to steps,
   demonstration image/GIF, and target muscle
10. Progress is tracked (per-exercise done, per-day completion)
```

### Later phases (placeholders — UI stubs only in v1)
- **4.1 Food & calories:** user logs foods eaten + calories; if no calorie value,
  we estimate a rough one. Premium (paid, later): upload a food photo → AI API
  returns calories.
- **4.2 Analytics:** rich plots of workouts completed, calories burned in
  workouts, body-weight trend; periodic (weekly/monthly) check-in inputs.

---

## 6. AI Provider Model (bring-your-own)

The user is always in control of which AI they use and pays nothing to us.

- **Provider picker:** user selects e.g. *Google Gemini*, *OpenAI*, *Anthropic Claude*.
- **Guided token setup:** for the chosen provider we show a short, illustrated,
  localized "how to get your API token" walkthrough (where to sign up, which page,
  which button, how to copy the key). Gemini is highlighted because it has a
  genuinely free API tier.
- **Token handling (security):** the token is sensitive. Design intent:
  - Preferred: token stored **encrypted at rest** (Supabase), only decrypted
    server-side when making the call; never exposed to other users.
  - The app calls the provider from a **server route** (avoids browser CORS and
    keeps the key off the client where possible).
  - User can delete their token anytime.
- **Copy-paste mode needs no token** and is always available as the zero-cost path.

> Detailed provider endpoints, request shapes, and storage/encryption specifics
> belong in `structure.md`.

---

## 7. The Engineered Prompt & Structured Response

The reliability of the whole app depends on getting a **consistent, parseable**
answer. Free-form prose (like the example the user provided) is hard to parse.
**Strategy: instruct the AI to return strict JSON only**, following a fixed
schema. JSON pastes cleanly out of any chat UI and is trivial to parse.

### 7.1 Prompt template (English)

Placeholders in `{{...}}` are filled from the user profile.

```
You are a certified strength & conditioning coach.
Create a weekly workout plan for the following person:

- Goal: {{goal}}                         // e.g. "lose fat and gain muscle (body recomposition)"
- Sex: {{sex}}
- Age: {{age}}
- Height: {{height_cm}} cm
- Weight: {{weight_kg}} kg
- Training days per week: {{days_per_week}}
- Time per session: {{session_minutes}} minutes
- Experience level: {{experience}}       // beginner | intermediate | advanced
- Available equipment: {{equipment}}      // full gym | home dumbbells | bodyweight only
- Injuries / limitations: {{limitations}} // or "none"

RESPOND WITH VALID JSON ONLY. No greeting, no explanation, no markdown code
fences, no text before or after the JSON. Use this exact schema:

{
  "plan_meta": {
    "goal": "string",
    "days_per_week": number,
    "session_minutes": number,
    "split_type": "string",              // e.g. "upper_lower", "push_pull_legs", "full_body"
    "summary": "string"                  // <= 200 chars
  },
  "week": [
    {
      "day_index": number,               // 1 = Monday ... 7 = Sunday
      "title": "string",                 // e.g. "Upper Body Strength" or "Rest"
      "type": "string",                  // "workout" | "rest" | "active_recovery"
      "focus": ["string"],               // muscle groups, empty for rest days
      "estimated_minutes": number,
      "warmup": [ { "name": "string", "duration_min": number } ],
      "exercises": [
        {
          "name": "string",              // human-readable, e.g. "Barbell Bench Press"
          "canonical_id": "string",      // lowercase-hyphenated, e.g. "barbell-bench-press"
          "primary_muscle": "string",    // e.g. "chest"
          "sets": number,
          "reps": "string",              // e.g. "6-8" or "12" or "30 sec"
          "rest_sec": number,
          "how_to": "string",            // 1-2 sentence plain explanation of how to perform it
          "notes": "string"              // short cue, may be ""
        }
      ],
      "finisher": [ { "name": "string", "duration_min": number } ]
    }
  ],
  "nutrition": {
    "calorie_guidance": "string",
    "protein_g_per_day": "string",
    "notes": "string"
  },
  "progression": "string"                // how to progress week to week, <= 300 chars
}

Rules:
- Include exactly {{days_per_week}} days with "type":"workout"; fill the rest of
  the 7-day week with "rest" or "active_recovery".
- Keep every workout within {{session_minutes}} minutes.
- Use widely-known exercise names so a demonstration library can match them.
- "canonical_id" must be the lowercase, hyphenated form of "name".
- Output MUST be parseable by JSON.parse with no edits.
```

### 7.2 Traditional Chinese
A localized version of the same prompt is shown when the UI language is 繁體中文.
**The JSON keys stay in English** (so parsing is language-independent); only the
instructions and the human-readable string *values* (titles, notes) may be Chinese.

### 7.3 Parsing & resilience strategy
Even with a strict prompt, models sometimes wrap JSON in ```` ```json ```` fences
or add a stray sentence. The parser must be forgiving:
1. Strip markdown code fences if present.
2. Extract the substring from the first `{` to the last `}`.
3. `JSON.parse`; if it fails, show a friendly error with a "paste again" option
   and a "the AI added extra text — try copying only the plan" hint.
4. Validate against the schema (e.g. with Zod). Missing optional blocks
   (nutrition/finisher) are tolerated.
5. Store both the **raw response** (for debugging / re-parse) and the
   **parsed structured plan**.

### 7.4 Exercise demonstrations & how-to (chosen source)
Every exercise carries a `canonical_id`. We match it to an external, free,
public-domain library rather than hosting media ourselves.

**Primary source (decided): [`free-exercise-db`](https://github.com/yuhonas/free-exercise-db)**
- **License: Unlicense (public domain)** — no attribution or usage restrictions.
- 800+ exercises; each entry provides `name`, `primaryMuscles`,
  `secondaryMuscles`, **`instructions` (step-by-step how-to)**, and `images`.
- Images are **hot-linked directly from a CDN** (no need to store them):
  `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<image_path>`
  (or via jsDelivr for CDN caching). This satisfies "link to the website and use
  those links" — we store only the mapping, not the media.
- This one source covers BOTH the demonstration image AND the how-to text, so
  the exercise-detail popup shows: how-to steps + image + primary/secondary muscle.

**Matching strategy**
- Build a lookup at plan-parse time: `canonical_id` (and the human name) →
  best-matching `free-exercise-db` entry (normalized-name match, with a small
  synonym/alias table for common naming differences).
- The AI-provided `how_to` field (§7.1) is a fallback if no library match is found.

**Fallbacks (in order)**
1. Matched library entry → show its image + instructions.
2. No image but muscle known → show a **muscle-group diagram / label** so the
   user still sees which muscle the exercise targets.
3. No match at all → show the exercise name + the AI's `how_to` text only.

**Optional later upgrade:** animated **GIF** datasets (e.g. ExerciseDB-style)
give looping animations, but their media carries more restrictive "Gym Visual"
terms — deferred to a later phase and only if licensing is cleared. If we ever
can't hot-link, we fall back to storing images/GIFs in Supabase Storage.

---

## 8. Data We Store (high-level)

Detailed schema lives in `structure.md`. Conceptually we track:

- **User profile:** goal, sex, age, height, weight, days/week, session length,
  experience, equipment, limitations, preferred language, preferred AI provider.
- **AI credentials:** provider + encrypted token (optional).
- **Plans:** raw AI response + parsed structured plan + created date + active flag.
- **Days & exercises:** derived from the parsed plan.
- **Completion log:** which exercise on which date was marked done.
- **(Later) Calendar link:** tokens/ids to sync workout days to Google Calendar.
- **(Later) Food log & body metrics:** for analytics.

---

## 9. Internationalization (i18n)

- Languages: **English** and **Traditional Chinese**; user-selectable, remembered
  per account and in the browser.
- All UI strings come from translation files (no hardcoded text).
- Locale affects: UI labels, the AI prompt template, date/number formatting.
- JSON schema keys remain English regardless of locale (see §7.2).
- Default language: detect from browser, fall back to English.

---

## 10. Free & Always-On (24/7) Considerations

- **Vercel** serves the Next.js app 24/7 on the free tier.
- **Supabase** free Postgres can **pause after ~7 days of inactivity**. Mitigation:
  a tiny scheduled ping (cron) hits a health endpoint that touches the DB, keeping
  it awake. (A free scheduler such as a GitHub Action on a cron, or Supabase's own
  scheduling, can do this.)
- No paid services in v1. Direct-API AI costs are borne by the **user's own** token.
- Demonstration GIFs should be served from a free/open source or Supabase Storage
  free tier; keep total asset size modest.

---

## 11. Open Questions / To Decide Later

1. ✅ **Resolved — Exercise demo source:** use `free-exercise-db` (public domain),
   hot-linking images from its CDN and using its step-by-step instructions
   (see §7.4). No media hosted by us unless hot-linking ever fails.
2. ✅ **Resolved — Token storage:** if a token is saved, it is **encrypted at
   rest**; decrypted only server-side at call time; user can delete anytime (§6).
3. ✅ **Resolved — Trial mode:** allow a "no account / local-only" trial. Data
   lives in the browser (localStorage/IndexedDB); a "sign in to save" path
   migrates it into the account. See structure doc.
4. ✅ **Resolved — Units:** include an **imperial ↔ metric toggle** from the
   start (stored per profile; metric is the default).
5. ✅ **Resolved — Keep-alive:** a **GitHub Action cron** pings a health
   endpoint that touches the DB to keep Supabase's free tier awake.

---

## 12. Phase Roadmap (summary)

- **Phase 1 (v1 / MVP):** auth, profile, prompt generation, copy-paste + direct-API
  plan intake, parsing, calendar view, workout day view, check-off, exercise
  GIF popup, EN/繁中 i18n.
- **Phase 2:** Google Calendar sync; imperial units; richer exercise library.
- **Phase 3:** Food logging (manual + rough estimate); basic progress plots.
- **Phase 4 (premium):** food-photo → calorie via AI API; advanced analytics;
  weekly/monthly check-ins.

---

*Next step: define the technical structure in `docs/Project/src/structure.md`
(folder layout, database schema, component tree, API routes, i18n setup,
exercise-library design). After both docs are agreed, we set up the build agents.*
