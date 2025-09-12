import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertBasicEnv() {
  const miss: string[] = [];
  if (!PUBLIC_URL) miss.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!PUBLIC_ANON_KEY) miss.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (miss.length) {
    throw new Error('[Supabase] Faltan variables: ' + miss.join(', '));
  }
}
assertBasicEnv();

declare global {
  // eslint-disable-next-line no-var
  var __SB_BROWSER__: SupabaseClient | undefined;
}

export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowser() solo en cliente');
  }
  if (!globalThis.__SB_BROWSER__) {
    globalThis.__SB_BROWSER__ = createClient(PUBLIC_URL!, PUBLIC_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return globalThis.__SB_BROWSER__;
}

export function getSupabaseServer(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseServer() solo en servidor');
  }
  return createClient(PUBLIC_URL!, PUBLIC_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getSupabaseServiceRole(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('Service role NUNCA en el navegador');
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(PUBLIC_URL!, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
