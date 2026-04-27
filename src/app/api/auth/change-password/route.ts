import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

/* ===== Supabase server-side client ===== */
function getServerDb() {
  // Server-side: prefer Docker internal URL (works inside containers)
  const url = process.env.SUPABASE_INTERNAL_URL || 'http://10.0.2.9:8000';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/* ===== Legacy SHA-256 helpers (for verifying old passwords) ===== */

async function sha256(message: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(message).digest('hex');
}

async function legacyHashPassword(password: string, salt: string): Promise<string> {
  let hash = await sha256(salt + ':' + password);
  for (let i = 0; i < 100; i++) {
    hash = await sha256(salt + ':' + hash);
  }
  return `${salt}:${hash}`;
}

async function legacyVerifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.includes(':')) {
    return password === stored;
  }
  const [salt] = stored.split(':');
  const computed = await legacyHashPassword(password, salt);
  return computed === stored;
}

/* ===== POST handler ===== */

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
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, reason: 'missing_fields' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, reason: 'password_too_short' },
        { status: 400 }
      );
    }

    // Look up employee
    const db = getServerDb();
    const { data: employees, error: dbError } = await db
      .from('employees')
      .select('*')
      .eq('id', userId)
      .limit(1);

    if (dbError) {
      console.error('[auth/change-password] DB error:', dbError.message);
      return NextResponse.json(
        { success: false, reason: 'server_error' },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { success: false, reason: 'not_found' },
        { status: 404 }
      );
    }

    const emp = employees[0] as Record<string, unknown>;
    const storedPassword = (emp.password_hash ?? '') as string;

    // Verify current password
    let passwordValid = false;

    if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
      passwordValid = await bcrypt.compare(currentPassword, storedPassword);
    } else {
      // Legacy verification
      passwordValid = await legacyVerifyPassword(currentPassword, storedPassword);
    }

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, reason: 'wrong_password' },
        { status: 401 }
      );
    }

    // Hash new password with bcrypt
    const newBcryptHash = await bcrypt.hash(newPassword, 10);

    // Update in Supabase
    const { error: updateError } = await db
      .from('employees')
      .update({
        password_hash: newBcryptHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[auth/change-password] Update error:', updateError.message);
      return NextResponse.json(
        { success: false, reason: 'server_error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[auth/change-password] Unexpected error:', err);
    return NextResponse.json(
      { success: false, reason: 'server_error' },
      { status: 500 }
    );
  }
}
