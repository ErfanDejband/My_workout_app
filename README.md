# Workout Tracker

A free, always-on web app for building and tracking a personalized weekly workout
plan, powered by the AI you already use (bring your own provider/token, or just
copy-paste). Bilingual: English + Traditional Chinese.

- **Concept (what & why):** [`docs/Project/concept.md`](docs/Project/concept.md)
- **Structure (how it's built):** [`docs/Project/src/structure.md`](docs/Project/src/structure.md)
- **Section agents:** [`.claude/agents/`](.claude/agents)

## Stack
Next.js (App Router) · Supabase (Postgres + Auth + Storage) · next-intl ·
Tailwind CSS · Zod. Deployed free on Vercel + Supabase.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase + keys
npm run dev
```

Open http://localhost:3000 — you'll be redirected to a locale (`/en` or `/zh-Hant`).

### Environment
See `.env.local.example`. You need a Supabase project (URL + anon key), a
service-role key, and a 32-byte `TOKEN_ENC_KEY` for encrypting AI tokens..

### Database
Apply the schema in `supabase/migrations/` to your Supabase project via the
Supabase CLI (`supabase db push`) or by running the SQL in the dashboard.

### Keep-alive
Set a GitHub Actions secret `KEEPALIVE_URL` to
`https://<your-domain>/api/keepalive`; the workflow in
`.github/workflows/keepalive.yml` pings it every 3 days.

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check
