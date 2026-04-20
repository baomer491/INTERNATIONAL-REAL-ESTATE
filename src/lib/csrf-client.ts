/**
 * Client-side CSRF token helper.
 *
 * Fetches a CSRF token from /api/csrf-token and stores it in localStorage.
 * Provides a helper to get the headers needed for API calls.
 */

const CSRF_STORAGE_KEY = 'csrf_token';

/**
 * Fetch a fresh CSRF token from the server and cache it in localStorage.
 * Called on login and whenever a CSRF error is encountered.
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/csrf-token');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CSRF_STORAGE_KEY, data.token);
      }
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the cached CSRF token.
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CSRF_STORAGE_KEY);
}

/**
 * Clear the cached CSRF token (e.g., on logout).
 */
export function clearCsrfToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CSRF_STORAGE_KEY);
  }
}

/**
 * Returns the headers object with the x-csrf-token header included.
 * Use this when making fetch calls to protected API routes.
 *
 * Usage:
 *   const headers = { 'Content-Type': 'application/json', ...csrfHeaders() };
 *   fetch('/api/ocr', { method: 'POST', headers, body: ... });
 */
export function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  if (!token) return {};
  return { 'x-csrf-token': token };
}
