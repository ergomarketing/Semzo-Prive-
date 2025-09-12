import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON) {
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

declare global {
  // eslint-disable-next-line no-var
  var __SB__: SupabaseClient | undefined;
}

export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') throw new Error('getSupabaseBrowser solo en cliente');
  if (!globalThis.__SB__) {
    globalThis.__SB__ = createClient(URL, ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return globalThis.__SB__;
}

export function getSupabaseServer(): SupabaseClient {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getSupabaseServiceRole(): SupabaseClient {
  if (!SERVICE) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  return createClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
