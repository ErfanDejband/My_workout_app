# Deployment & Auth Configuration Guide

Practical setup for running the app on Vercel with Supabase Google sign-in, and
the fix for the "after Google login it redirects me to localhost" problem.

---

## Why the localhost redirect happens

The OAuth flow is:

```
your site  →  Supabase authorize  →  Google  →  Supabase callback  →  redirect back to your app
```

When Supabase hands control back to your app, it only redirects to the URL your
app asked for **if that URL is in Supabase's allow-list**. If it is NOT
allow-listed, Supabase falls back to its configured **Site URL**. Your Site URL
is currently `http://localhost:3000`, so production logins bounce to localhost.

**Fix = tell Supabase about the Vercel URL** (and keep localhost for dev). It is a
dashboard-configuration fix, not a code change.

---

## 1. Supabase → Authentication → URL Configuration

Set:

- **Site URL:** `https://my-workout-app-brown.vercel.app`
  (the stable production URL — used as the default redirect target)

- **Redirect URLs (allow-list):** add all of these
  - `https://my-workout-app-brown.vercel.app/**`
  - `http://localhost:3000/**`
  - `https://my-workout-app-*.vercel.app/**`  ← optional, enables Vercel preview deploys

`**` matches any path; `*` matches one path/subdomain segment.

## 2. Google Cloud Console → Credentials → your OAuth 2.0 Client

This does **not** change per environment. Authorized redirect URI stays:

- `https://<your-project-ref>.supabase.co/auth/v1/callback`

(Google always redirects to Supabase, never directly to your app, so no Vercel or
localhost URLs are needed here.)

## 3. Vercel → Project → Settings → Environment Variables

Add these for the **Production** (and Preview) environments, then redeploy:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service-role / secret key |
| `TOKEN_ENC_KEY` | your 32-byte key (same as local) |
| `NEXT_PUBLIC_SITE_URL` | `https://my-workout-app-brown.vercel.app` |

> The app builds `redirectTo` from `window.location.origin`, so both localhost and
> Vercel work automatically **once both are in the Supabase allow-list** (step 1).
> The callback route also honors `x-forwarded-host` so it lands on the real public
> URL behind Vercel's proxy.

## 4. Redeploy & test

1. Redeploy on Vercel (env var changes require a new deploy).
2. Visit `https://my-workout-app-brown.vercel.app`, sign in with Google.
3. You should land on `…/en/dashboard`, not localhost.
4. Confirm `http://localhost:3000` still works too.

---

## Checklist if it still misbehaves

- [ ] Supabase **Site URL** is the Vercel URL (not localhost).
- [ ] Vercel URL (with `/**`) is in Supabase **Redirect URLs**.
- [ ] Vercel env vars are set for **Production** and a fresh deploy ran.
- [ ] Google OAuth client has the `…supabase.co/auth/v1/callback` redirect URI.
- [ ] Supabase Google provider is **enabled** with the Google client id/secret.
