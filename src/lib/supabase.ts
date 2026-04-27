import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side: always use /api/supabase proxy (no build-time env needed)
// Server-side: use Docker internal URL when available
const isServer = typeof window === 'undefined';
const effectiveUrl = (isServer && process.env.SUPABASE_INTERNAL_URL)
  || '/api/supabase';

// Key is used by client; the /api/supabase proxy injects the real apikey from server env.
// A dummy value is fine for client-side initialization — the proxy overrides it.
const effectiveKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'proxy-handled';

/* ---------- Singleton helpers ---------- */

// Use globalThis to persist across HMR and module re-evaluations
const globalForDb = globalThis as unknown as { __supabaseDb?: SupabaseClient };
const globalForAdmin = globalThis as unknown as { __supabaseAdmin?: SupabaseClient };

function getDbClient(): SupabaseClient {
  if (!globalForDb.__supabaseDb) {
    globalForDb.__supabaseDb = createClient(effectiveUrl, effectiveKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        // Use unique storage key to prevent GoTrueClient "multiple instances" warning
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
    });
  }

  return globalForDb.__supabaseDb;
}

function getAdminClient(): SupabaseClient {
  if (!globalForAdmin.__supabaseAdmin) {
    globalForAdmin.__supabaseAdmin = createClient(
      effectiveUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || effectiveKey,
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
      },
    );
  }

  return globalForAdmin.__supabaseAdmin;
}

export const db: SupabaseClient = getDbClient();
export const supabaseAdmin: SupabaseClient = getAdminClient();

export default db;
