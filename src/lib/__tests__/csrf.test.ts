import { describe, it, expect } from 'vitest';
import { generateToken, validateToken, CSRF_COOKIE_NAME } from '@/lib/csrf';

describe('CSRF Token Generation and Validation', () => {
  it('should export the cookie name constant', () => {
    expect(CSRF_COOKIE_NAME).toBe('csrf_token');
  });

  it('should generate a hex string token', () => {
    const token = generateToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('should generate unique tokens on each call', () => {
    const token1 = generateToken();
    const token2 = generateToken();
    expect(token1).not.toBe(token2);
  });

  it('should return null when both cookie and header match', () => {
    const token = generateToken();
    const request = {
      headers: { get: () => token },
      cookies: { get: () => ({ value: token }) },
    };
    expect(validateToken(request)).toBeNull();
  });

  it('should return error when cookie token is missing', () => {
    const request = {
      headers: { get: () => 'some-token' },
      cookies: { get: () => undefined },
    };
    expect(validateToken(request)).toBe('Missing CSRF token');
  });

  it('should return error when header token is missing', () => {
    const request = {
      headers: { get: () => null },
      cookies: { get: () => ({ value: 'some-token' }) },
    };
    expect(validateToken(request)).toBe('Missing CSRF token');
  });

  it('should return error when both tokens are missing', () => {
    const request = {
      headers: { get: () => null },
      cookies: { get: () => undefined },
    };
    expect(validateToken(request)).toBe('Missing CSRF token');
  });

  it('should return error when tokens do not match', () => {
    const request = {
      headers: { get: () => 'header-token' },
      cookies: { get: () => ({ value: 'cookie-token' }) },
    };
    expect(validateToken(request)).toBe('CSRF token mismatch');
  });

  it('should generate tokens of consistent length', () => {
    const tokens = Array.from({ length: 5 }, () => generateToken());
    const lengths = tokens.map(t => t.length);
    expect(new Set(lengths).size).toBe(1);
  });
});
