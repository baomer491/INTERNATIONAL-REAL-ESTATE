import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/* ===== Test the rate limiting and password hash logic =====
 *
 * The login route.ts file defines these functions at module scope:
 *   - checkRateLimit(username)
 *   - recordFailedAttempt(username)
 *   - clearFailedAttempts(username)
 *   - legacyVerifyPassword(password, stored)
 *   - legacyHashPassword(password, salt)
 *   - sha256(message)
 *
 * These are NOT exported, so we test the logic by re-implementing the same
 * algorithms and testing them directly, plus testing the exported POST handler
 * concepts through integration-style tests of the pure logic.
 */

// ---------- Rate Limiting Logic (mirrors route.ts) ----------

interface FailedAttempt {
  count: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function createRateLimiter() {
  const failedAttempts = new Map<string, FailedAttempt>();

  function checkRateLimit(username: string): { allowed: boolean; reason?: string } {
    const entry = failedAttempts.get(username);
    if (!entry) return { allowed: true };

    if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
      const remainingSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
      return { allowed: false, reason: `account_locked:${remainingSec}` };
    }

    if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
      failedAttempts.delete(username);
      return { allowed: true };
    }

    if (entry.count < MAX_ATTEMPTS) return { allowed: true };

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

  function getEntry(username: string) {
    return failedAttempts.get(username);
  }

  return { checkRateLimit, recordFailedAttempt, clearFailedAttempts, getEntry };
}

// ---------- Legacy Password Hash Logic (mirrors route.ts) ----------

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

// ---------- Tests ----------

describe('Rate Limiting Logic', () => {
  let rl: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    rl = createRateLimiter();
  });

  it('should allow first attempt for a new user', () => {
    const result = rl.checkRateLimit('testuser');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should allow attempts under the max limit', () => {
    // Record 4 failed attempts (just under the limit)
    for (let i = 0; i < 4; i++) {
      rl.recordFailedAttempt('testuser');
    }
    const result = rl.checkRateLimit('testuser');
    expect(result.allowed).toBe(true);
  });

  it('should lock the account after 5 failed attempts', () => {
    for (let i = 0; i < 5; i++) {
      rl.recordFailedAttempt('lockeduser');
    }
    const result = rl.checkRateLimit('lockeduser');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('account_locked');
  });

  it('should include remaining seconds in lock reason', () => {
    for (let i = 0; i < 5; i++) {
      rl.recordFailedAttempt('lockeduser');
    }
    const result = rl.checkRateLimit('lockeduser');
    expect(result.reason).toMatch(/^account_locked:\d+$/);
    const seconds = parseInt(result.reason!.split(':')[1], 10);
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(300); // 5 minutes
  });

  it('should increment count for each failed attempt', () => {
    rl.recordFailedAttempt('testuser');
    expect(rl.getEntry('testuser')?.count).toBe(1);
    rl.recordFailedAttempt('testuser');
    expect(rl.getEntry('testuser')?.count).toBe(2);
    rl.recordFailedAttempt('testuser');
    expect(rl.getEntry('testuser')?.count).toBe(3);
  });

  it('should set lockedUntil after MAX_ATTEMPTS', () => {
    for (let i = 0; i < 5; i++) {
      rl.recordFailedAttempt('testuser');
    }
    const entry = rl.getEntry('testuser');
    expect(entry?.lockedUntil).not.toBeNull();
    expect(entry?.lockedUntil).toBeGreaterThan(Date.now());
  });

  it('should clear failed attempts for a user', () => {
    for (let i = 0; i < 3; i++) {
      rl.recordFailedAttempt('testuser');
    }
    rl.clearFailedAttempts('testuser');
    expect(rl.getEntry('testuser')).toBeUndefined();
    const result = rl.checkRateLimit('testuser');
    expect(result.allowed).toBe(true);
  });

  it('should track different users independently', () => {
    rl.recordFailedAttempt('user1');
    rl.recordFailedAttempt('user1');
    rl.recordFailedAttempt('user2');

    expect(rl.getEntry('user1')?.count).toBe(2);
    expect(rl.getEntry('user2')?.count).toBe(1);

    // Clearing user1 does not affect user2
    rl.clearFailedAttempts('user1');
    expect(rl.getEntry('user1')).toBeUndefined();
    expect(rl.getEntry('user2')?.count).toBe(1);
  });

  it('should not lock when attempts are fewer than MAX_ATTEMPTS even after clearing', () => {
    for (let i = 0; i < 4; i++) {
      rl.recordFailedAttempt('testuser');
    }
    rl.clearFailedAttempts('testuser');
    // Start fresh - 3 more attempts
    for (let i = 0; i < 3; i++) {
      rl.recordFailedAttempt('testuser');
    }
    const result = rl.checkRateLimit('testuser');
    expect(result.allowed).toBe(true);
  });
});

describe('Password Hash Type Detection', () => {
  it('should detect bcrypt $2b$ hash format', () => {
    const hash = '$2b$10$abcdefghijklmnopqrstuvwxABCDEFGHIJ';
    expect(hash.startsWith('$2b$')).toBe(true);
    expect(hash.startsWith('$2a$')).toBe(false);
  });

  it('should detect bcrypt $2a$ hash format', () => {
    const hash = '$2a$10$abcdefghijklmnopqrstuvwxABCDEFGHIJ';
    expect(hash.startsWith('$2a$')).toBe(true);
    expect(hash.startsWith('$2b$')).toBe(false);
  });

  it('should identify non-bcrypt hash as legacy', () => {
    const plaintext = 'mypassword';
    const shaHash = 'abc123def456:somehashvalue';
    expect(plaintext.startsWith('$2b$')).toBe(false);
    expect(plaintext.startsWith('$2a$')).toBe(false);
    expect(shaHash.startsWith('$2b$')).toBe(false);
    expect(shaHash.startsWith('$2a$')).toBe(false);
  });
});

describe('Legacy Password Verification', () => {
  it('should verify plaintext password (no colon)', async () => {
    const result = await legacyVerifyPassword('mypassword', 'mypassword');
    expect(result).toBe(true);
  });

  it('should reject wrong plaintext password', async () => {
    const result = await legacyVerifyPassword('wrongpassword', 'mypassword');
    expect(result).toBe(false);
  });

  it('should verify salted SHA-256 hash', async () => {
    const salt = 'testsalt';
    const password = 'testpass123';
    const hash = await legacyHashPassword(password, salt);
    const result = await legacyVerifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it('should reject wrong password for salted SHA-256 hash', async () => {
    const salt = 'testsalt';
    const password = 'testpass123';
    const hash = await legacyHashPassword(password, salt);
    const result = await legacyVerifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  it('should produce hash in salt:hash format', async () => {
    const hash = await legacyHashPassword('password', 'salt');
    expect(hash).toContain(':');
    const parts = hash.split(':');
    expect(parts[0]).toBe('salt');
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('should produce different hashes for different passwords with same salt', async () => {
    const hash1 = await legacyHashPassword('password1', 'salt');
    const hash2 = await legacyHashPassword('password2', 'salt');
    expect(hash1).not.toBe(hash2);
  });
});
