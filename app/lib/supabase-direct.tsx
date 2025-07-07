import { createClient } from "@supabase/supabase-js"

// Cliente exclusivo para backend con permisos elevados
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,       // URL pública del proyecto
  process.env.SUPABASE_SERVICE_ROLE_KEY!       // Clave secreta (solo en backend)
)

export { supabase }
