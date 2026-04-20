import { NextResponse } from 'next/server';
import { generateToken, CSRF_COOKIE_NAME } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = generateToken();

  const response = NextResponse.json({ success: true, token });

  // Set the CSRF token as an HttpOnly cookie so the server can read it,
  // but also return it in the response body for the client to use as a header.
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: false, // App runs on HTTP locally — secure:true would block the cookie
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return response;
}
