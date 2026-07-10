import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';

// Google OAuth callback. Supabase redirects here with a `code`; we exchange it
// for a session (PKCE), then send the user on to `next`. Lives under /api so it
// is excluded from the locale middleware.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? `/${routing.defaultLocale}/dashboard`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/${routing.defaultLocale}/login?error=auth`
  );
}
