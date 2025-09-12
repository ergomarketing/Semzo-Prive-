/*
  app/lib/supabaseClient.ts
  Cliente Supabase unificado.
  - Browser: getSupabaseBrowser()
  - Server (SSR / Rutas): getSupabaseServer()
  - Service Role (solo backend): getSupabaseServiceRole()
*/

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validación mínima (lanza si faltan públicas)
if (!PUBLIC_URL || !PUBLIC_ANON_KEY) {
  throw new Error('[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE_BROWSER__: SupabaseClient | undefined;
}

export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowser() solo se usa en el navegador');
  }
  if (!globalThis.__SUPABASE_BROWSER__) {
    globalThis.__SUPABASE_BROWSER__ = createClient(PUBLIC_URL!, PUBLIC_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return globalThis.__SUPABASE_BROWSER__;
}

export function getSupabaseServer(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseServer() solo servidor');
  }
  return createClient(PUBLIC_URL!, PUBLIC_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function getSupabaseServiceRole(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('Service role prohibido en el cliente');
  }
  if (!SERVICE_ROLE_KEY) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(PUBLIC_URL!, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
