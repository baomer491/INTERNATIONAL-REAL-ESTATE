import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side URL (browser reaches Kong via Traefik on local network)
// Server-side URL (Docker container reaches Kong via internal network)
const supabaseUrl = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  : (process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '');

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use a dummy placeholder during build when env vars are not available
const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey = 'placeholder-key';

const effectiveUrl = supabaseUrl || placeholderUrl;
const effectiveKey = supabaseAnonKey || placeholderKey;

/* ---------- Singleton helpers ---------- */

// Use globalThis to persist across HMR and module re-evaluations
const globalForDb = globalThis as unknown as { __supabaseDb?: SupabaseClient };
const globalForAdmin = globalThis as unknown as { __supabaseAdmin?: SupabaseClient };

function getDbClient(): SupabaseClient {
  if (globalForDb.__supabaseDb) return globalForDb.__supabaseDb;

  globalForDb.__supabaseDb = createClient(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      // Disable storage to prevent GoTrueClient from using localStorage
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
    realtime: {
      // Don't connect realtime automatically - we manage it manually
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return globalForDb.__supabaseDb;
}

function getAdminClient(): SupabaseClient {
  if (globalForAdmin.__supabaseAdmin) return globalForAdmin.__supabaseAdmin;

  globalForAdmin.__supabaseAdmin = createClient(
    effectiveUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || effectiveKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      },
    },
  );

  return globalForAdmin.__supabaseAdmin;
}

export const db: SupabaseClient = getDbClient();
export const supabaseAdmin: SupabaseClient = getAdminClient();

export default db;
