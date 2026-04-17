import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in-memory, resets on server restart)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, API routes, and _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check for auth session cookie
  const sessionToken = request.cookies.get('ireo_session')?.value;

  if (!sessionToken) {
    // Redirect to root (which shows login page) if no session
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
