import crypto from 'crypto';

/**
 * CSRF Protection Utilities
 *
 * Uses the Double Submit Cookie pattern:
 * - Server sets a csrf_token cookie
 * - Client reads the cookie and sends it back as x-csrf-token header
 * - Server compares the header value against the cookie value
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf_token';

export { CSRF_COOKIE_NAME };

/**
 * Generate a cryptographically random CSRF token (hex string).
 */
export function generateToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate a CSRF token from the x-csrf-token header against the csrf_token cookie.
 * Returns an error message string if validation fails, or null if valid.
 */
export function validateToken(request: { headers: { get(name: string): string | null }; cookies: { get(name: string): { value: string } | undefined } }): string | null {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (!cookieToken || !headerToken) {
    return 'Missing CSRF token';
  }

  if (cookieToken !== headerToken) {
    return 'CSRF token mismatch';
  }

  return null;
}
