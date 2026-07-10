import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { routing } from './i18n/routing';

// Composes two concerns:
//  1. next-intl locale detection + locale-prefixed routing
//  2. Supabase session refresh (so Server Components see a fresh session) and
//     protection of authenticated-only routes.
// Must live in src/ because the app uses a src directory.

const intlMiddleware = createIntlMiddleware(routing);

// Paths (after the /<locale> prefix) that require a signed-in user.
const PROTECTED = ['/dashboard', '/settings'];

export async function middleware(request: NextRequest) {
  // Run locale routing first; we then attach any refreshed auth cookies to it.
  const response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const withoutLocale = pathname.replace(/^\/(en|zh-Hant)/, '') || '/';
  const isProtected = PROTECTED.some((p) => withoutLocale.startsWith(p));

  if (isProtected && !user) {
    const locale = pathname.split('/')[1] || routing.defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
};
