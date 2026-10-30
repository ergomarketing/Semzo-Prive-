import { createClient } from "@supabase/supabase-js"

/**
 * Cliente con la clave de servicio (salta RLS). SOLO para rutas de servidor que ya han comprobado quien es la usuaria.
 * Las tablas de gift cards no tienen politicas para el navegador: se leen y escriben unicamente por aqui.
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service credentials not configured")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
