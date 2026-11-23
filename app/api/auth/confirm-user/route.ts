import { type NextRequest } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { getServiceClient } from "@/lib/supabase-service"

// Confirma a mano el correo de una usuaria. Solo administracion (antes estaba abierto a cualquiera).
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request)
  if (authError) return authError

  try {
    const { email } = await request.json()
    if (typeof email !== "string" || !email.includes("@")) {
      return Response.json({ success: false, error: "Email no válido" }, { status: 400 })
    }

    const supabase = getServiceClient()
    const wanted = email.trim().toLowerCase()

    // listUsers pagina de 50 en 50 por defecto: se recorren todas las paginas hasta encontrarla.
    let target: { id: string } | undefined
    for (let page = 1; page <= 50 && !target; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) return Response.json({ success: false, error: "Error buscando al usuario" }, { status: 500 })
      target = data.users.find((u) => (u.email || "").toLowerCase() === wanted)
      if (data.users.length < 1000) break
    }

    if (!target) return Response.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })

    const { error: updateError } = await supabase.auth.admin.updateUserById(target.id, { email_confirm: true })
    if (updateError) return Response.json({ success: false, error: "Error confirmando usuario" }, { status: 500 })

    return Response.json({ success: true, message: "Usuario confirmado" })
  } catch {
    return Response.json({ success: false, error: "Error confirmando usuario" }, { status: 500 })
  }
}
