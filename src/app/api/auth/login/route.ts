import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

/* ===== Supabase server-side client ===== */
function getServerDb() {
  // Server-side: use public URL (app runs on host, not in Docker network)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/* ===== Legacy SHA-256 helpers (for migration path) ===== */

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
  // Plaintext (no colon separator)
  if (!stored.includes(':')) {
    return password === stored;
  }
  // SHA-256 salted hash
  const [salt] = stored.split(':');
  const computed = await legacyHashPassword(password, salt);
  return computed === stored;
}

/* ===== Rate Limiting (in-memory, per username) ===== */

interface FailedAttempt {
  count: number;
  lockedUntil: number | null; // timestamp ms
}

const failedAttempts = new Map<string, FailedAttempt>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(username: string): { allowed: boolean; reason?: string } {
  const entry = failedAttempts.get(username);
  if (!entry) return { allowed: true };

  // If locked and lock hasn't expired
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    const remainingSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    return { allowed: false, reason: `account_locked:${remainingSec}` };
  }

  // If lock expired, reset
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    failedAttempts.delete(username);
    return { allowed: true };
  }

  // If under max attempts, allow
  if (entry.count < MAX_ATTEMPTS) return { allowed: true };

  // Should not reach here, but reset just in case
  failedAttempts.delete(username);
  return { allowed: true };
}

function recordFailedAttempt(username: string): void {
  const entry = failedAttempts.get(username) || { count: 0, lockedUntil: null };
  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_DURATION_MS;
  }

  failedAttempts.set(username, entry);
}

function clearFailedAttempts(username: string): void {
  failedAttempts.delete(username);
}

/* ===== POST handler ===== */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, reason: 'missing_fields' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(username);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, reason: rateCheck.reason },
        { status: 429 }
      );
    }

    // Look up employee by username
    const db = getServerDb();
    const { data: employees, error: dbError } = await db
      .from('employees')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (dbError) {
      console.error('[auth/login] DB error:', dbError.message);
      return NextResponse.json(
        { success: false, reason: 'server_error' },
        { status: 500 }
      );
    }

    if (!employees || employees.length === 0) {
      recordFailedAttempt(username);
      return NextResponse.json(
        { success: false, reason: 'invalid_credentials' },
        { status: 401 }
      );
    }

    const emp = employees[0] as Record<string, unknown>;
    const storedPassword = (emp.password_hash ?? '') as string;
    const empStatus = (emp.status ?? 'active') as string;

    // Check account status
    if (empStatus === 'suspended') {
      return NextResponse.json(
        { success: false, reason: 'suspended' },
        { status: 403 }
      );
    }
    if (empStatus === 'inactive') {
      return NextResponse.json(
        { success: false, reason: 'inactive' },
        { status: 403 }
      );
    }

    // Verify password
    let passwordValid = false;
    let needsMigration = false;

    if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
      // bcrypt hash — verify with bcrypt
      passwordValid = await bcrypt.compare(password, storedPassword);
    } else {
      // Legacy: plaintext or SHA-256 salted hash (has colon separator)
      passwordValid = await legacyVerifyPassword(password, storedPassword);
      needsMigration = passwordValid;
    }

    if (!passwordValid) {
      recordFailedAttempt(username);
      return NextResponse.json(
        { success: false, reason: 'invalid_credentials' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(username);

    // Migrate password to bcrypt if needed
    if (needsMigration) {
      try {
        const bcryptHash = await bcrypt.hash(password, 10);
        await db
          .from('employees')
          .update({ password_hash: bcryptHash, updated_at: new Date().toISOString() })
          .eq('id', emp.id as string);
        console.log(`[auth/login] Migrated password to bcrypt for user: ${username}`);
      } catch (migrationErr) {
        console.error('[auth/login] Password migration failed:', migrationErr);
        // Don't fail the login — migration can retry next time
      }
    }

    // Update last login
    const now = new Date().toISOString();
    await db
      .from('employees')
      .update({
        last_login: now,
        is_active_session: true,
        updated_at: now,
      })
      .eq('id', emp.id as string);

    // Insert login log
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await db.from('login_logs').insert({
        id: logId,
        employee_id: emp.id as string,
        employee_name: (emp.full_name ?? '') as string,
        action: 'login',
        timestamp: now,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
      });
    } catch (logErr) {
      console.error('[auth/login] Login log insert error:', logErr);
    }

    // Build response user data (exclude password)
    const userData = {
      id: emp.id as string,
      fullName: (emp.full_name ?? '') as string,
      username: (emp.username ?? '') as string,
      email: (emp.email ?? '') as string,
      phone: (emp.phone ?? '') as string,
      role: (emp.role ?? 'viewer') as string,
      status: (emp.status ?? 'active') as string,
      avatar: (emp.avatar ?? '') as string,
      department: (emp.department ?? '') as string,
      permissions: (emp.permissions ?? []) as string[],
    };

    // Set session cookie
    const sessionToken = `${emp.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    response.cookies.set('ireo_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (err) {
    console.error('[auth/login] Unexpected error:', err);
    return NextResponse.json(
      { success: false, reason: 'server_error' },
      { status: 500 }
    );
  }
}
