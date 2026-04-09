import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Verificar autenticación admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Recibir actualizaciones de orden
    const { updates } = await request.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 })
    }

    console.log(`[v0] Updating order for ${updates.length} bags`)

    // Actualizar display_order en lote
    for (const update of updates) {
      const { error } = await supabase.from("bags").update({ display_order: update.display_order }).eq("id", update.id)

      if (error) {
        console.error(`[v0] Error updating bag ${update.id}:`, error)
        throw error
      }
    }

    // Revalidar páginas del catálogo para reflejar cambios
    revalidatePath("/catalog")
    revalidatePath("/")

    console.log("[v0] Bag order updated and catalog revalidated")

    return NextResponse.json({
      success: true,
      message: "Orden actualizado correctamente",
    })
  } catch (error) {
    console.error("[v0] Error updating bag order:", error)
    return NextResponse.json({ error: "Error al guardar el orden" }, { status: 500 })
  }
}
