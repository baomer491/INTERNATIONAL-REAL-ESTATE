import { createClient } from '@supabase/supabase-js';

// Client-side URL (browser reaches Kong via Traefik on local network)
// Server-side URL (Docker container reaches Kong via internal network)
const supabaseUrl = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  : (process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '');

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const db = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export default db;
