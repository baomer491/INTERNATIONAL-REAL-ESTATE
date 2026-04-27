import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Logout endpoint — clears the httpOnly session cookie server-side.
 * The client cannot clear httpOnly cookies, so this route is required.
 */
export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });

  response.cookies.set('ireo_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
