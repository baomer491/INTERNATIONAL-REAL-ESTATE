import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client initialization.
 *
 * Client-side: uses a custom fetch that rewrites all API calls to /api/supabase proxy.
 * Server-side: uses SUPABASE_INTERNAL_URL directly (Docker network).
 *
 * The /api/supabase proxy injects the real apikey from server env vars,
 * so the client doesn't need the key at all.
 */

const isServer = typeof window === 'undefined';

/* ---------- Custom fetch for client-side proxy routing ---------- */

function createProxyFetch(): typeof globalThis.fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    if (isServer) return globalThis.fetch(input, init);

    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Rewrite any Supabase API call to go through our proxy
    // Matches: /rest/v1/..., /auth/v1/..., /storage/v1/..., /realtime/v1/...
    const rewritten = url.replace(/^https?:\/\/[^/]+\/(rest|auth|storage|realtime)\/v1\//, '/api/supabase/$1/v1/');

    return globalThis.fetch(rewritten, init);
  };
}

/* ---------- URLs and keys ---------- */

const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYzNjEwMTMsImV4cCI6MTk2MTkzNzAxM30.placeholder';

const effectiveUrl = isServer && process.env.SUPABASE_INTERNAL_URL
  ? process.env.SUPABASE_INTERNAL_URL
  : placeholderUrl;

const effectiveKey = isServer && process.env.SUPABASE_ANON_KEY
  ? process.env.SUPABASE_ANON_KEY
  : placeholderKey;

const customFetch = createProxyFetch();

/* ---------- Singleton helpers ---------- */

const globalForDb = globalThis as unknown as { __supabaseDb?: SupabaseClient };
const globalForAdmin = globalThis as unknown as { __supabaseAdmin?: SupabaseClient };

function getDbClient(): SupabaseClient {
  if (!globalForDb.__supabaseDb) {
    globalForDb.__supabaseDb = createClient(effectiveUrl, effectiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'ireo-auth',
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      global: {
        fetch: customFetch,
      },
    });
  }

  return globalForDb.__supabaseDb;
}

function getAdminClient(): SupabaseClient {
  if (!globalForAdmin.__supabaseAdmin) {
    globalForAdmin.__supabaseAdmin = createClient(
      effectiveUrl,
      isServer && process.env.SUPABASE_SERVICE_ROLE_KEY
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : effectiveKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storageKey: 'ireo-admin-auth',
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
        },
        global: {
          fetch: customFetch,
        },
      },
    );
  }

  return globalForAdmin.__supabaseAdmin;
}

export const db: SupabaseClient = getDbClient();
export const supabaseAdmin: SupabaseClient = getAdminClient();

export default db;
