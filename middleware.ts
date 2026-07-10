import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

// Handles locale detection + locale-prefixed routing.
// NOTE (auth agent): Supabase session refresh will be composed into this
// middleware later so protected routes can read the session at the edge.
export default createMiddleware(routing);

export const config = {
  // Match all paths except api, static files, and Next internals.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
