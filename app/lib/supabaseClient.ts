import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validación suave (no lanzamos para no romper SSR)
if (!PUBLIC_URL || !PUBLIC_ANON_KEY) {
  console.warn('[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE_BROWSER__: SupabaseClient | undefined;
}

/**
 * Navegador: devuelve el cliente o null si aún estamos en SSR/prerender.
 * NUNCA lanza error. Esto arregla el build de /cart y /_not-found.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!PUBLIC_URL || !PUBLIC_ANON_KEY) return null;
  if (!globalThis.__SUPABASE_BROWSER__) {
    globalThis.__SUPABASE_BROWSER__ = createClient(PUBLIC_URL, PUBLIC_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return globalThis.__SUPABASE_BROWSER__;
}

/**
 * Solo úsalo dentro de código de servidor (route handlers, actions, etc.)
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (!PUBLIC_URL || !PUBLIC_ANON_KEY) return null;
  return createClient(PUBLIC_URL, PUBLIC_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * Service role (solo backend). Devuelve null en cliente.
 */
export function getSupabaseServiceRole(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    return null;
  }
  if (!PUBLIC_URL || !SERVICE_ROLE_KEY) {
    console.warn('[Supabase] Service role no disponible (faltan variables).');
    return null;
  }
  return createClient(PUBLIC_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export type { SupabaseClient };
