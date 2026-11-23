import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

/**
 * Usuario autenticado segun la sesion de Supabase (cookies), verificada contra el servidor de Auth.
 * NUNCA fiarse de cabeceras como x-user-id, de la query ni del cuerpo: cualquiera puede inventarlos.
 */
export async function getSessionUser(): Promise<{ id: string; email: string | null } | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Solo lectura: esta funcion no renueva la sesion.
        },
      },
    })
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    return { id: user.id, email: user.email ?? null }
  } catch {
    return null
  }
}

export async function getSessionUserId(): Promise<string | null> {
  return (await getSessionUser())?.id ?? null
}
