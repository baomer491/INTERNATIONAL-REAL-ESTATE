import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

/**
 * POST /api/auth/hash-password
 * Hashes a password with bcrypt (salt rounds: 10).
 * Used by client-side code that needs to hash passwords before storing
 * (e.g., when adding a new employee).
 *
 * Requires a valid session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check: verify session cookie
    const sessionToken = request.cookies.get('ireo_session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, reason: 'unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string' || password.length < 1) {
      return NextResponse.json(
        { success: false, reason: 'missing_password' },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    return NextResponse.json({ success: true, hash });
  } catch (err) {
    console.error('[auth/hash-password] Error:', err);
    return NextResponse.json(
      { success: false, reason: 'server_error' },
      { status: 500 }
    );
  }
}
