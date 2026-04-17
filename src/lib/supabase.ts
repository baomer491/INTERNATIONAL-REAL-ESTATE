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

export const db: SupabaseClient = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin: SupabaseClient = createClient(
  effectiveUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || effectiveKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export default db;
