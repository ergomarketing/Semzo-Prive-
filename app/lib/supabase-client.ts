/* 
  supabaseClient.ts
  - Valida variables de entorno.
  - Evita crear múltiples instancias en desarrollo (hot reload).
  - Explica claramente qué falta si hay error.
  - Incluye helper opcional para usar la SERVICE ROLE SOLO en el servidor (NO la importes en componentes client-side).
*/

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* ========= Validación de variables públicas ========= */
const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function assertPublicEnv() {
  const missing: string[] = [];
  if (!PUBLIC_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!PUBLIC_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length) {
    throw new Error(
      `[Supabase] Faltan variables públicas: ${missing.join(', ')}
Asegúrate de tenerlas en tu archivo .env.local, por ejemplo:

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

(Luego reinicia el servidor de desarrollo).`
    );
  }
}
assertPublicEnv();

/* ========= Singleton (cliente navegador) ========= */
declare global {
  // Para evitar múltiples instancias en hot reload (Next.js dev)
  // eslint-disable-next-line no-var
  var __SUPABASE_BROWSER_CLIENT__: SupabaseClient | undefined;
}

/**
 * Obtiene (o crea) el cliente para usar en componentes 'use client'
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error(
      '[Supabase] getSupabaseBrowser() se llamó en el servidor. Usa getSupabaseServer() o getSupabaseServiceRole() allí.'
    );
  }
  if (!globalThis.__SUPABASE_BROWSER_CLIENT__) {
    globalThis.__SUPABASE_BROWSER_CLIENT__ = createClient(
      PUBLIC_URL!,
      PUBLIC_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }
  return globalThis.__SUPABASE_BROWSER_CLIENT__;
}

/* ========= Uso en el servidor (Rutas / Server Components) ========= */
/**
 * Crea un cliente para el servidor usando la ANON KEY (seguro para SSR).
 * No persiste sesión automáticamente: deberás inyectar el token si quieres
 * actuar en nombre del usuario (ej: leyendo cookies con auth-helpers).
 */
export function getSupabaseServer(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Supabase] getSupabaseServer() se llamó en el cliente. Usa getSupabaseBrowser() allí.'
    );
  }
  return createClient(PUBLIC_URL!, PUBLIC_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/* ========= Service Role (SOLO SERVIDOR) ========= */
/*
  IMPORTANTE:
  - NUNCA importes esto en código que pueda llegar al navegador.
  - Úsalo sólo en /app/api/*, /pages/api/* o scripts Node.
  - Esta key tiene poderes totales
