import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware.
 * Checks for `ireo_session` cookie on every request.
 * Redirects unauthenticated users to `/` (root, which renders LoginPage).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow root path — this is where the login page lives
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Skip static assets, Next.js internals, API routes, images, favicon
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (set by server on login with httpOnly flag)
  const session = request.cookies.get('ireo_session');

  if (!session || !session.value || session.value.trim() === '') {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /api (API routes)
     * - /_next (static files)
     * - /images (image assets)
     * - favicon.ico, etc.
     */
    '/((?!api|_next|images|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
