import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    console.log("[v0] POST /api/admin/bags/order called")
    
    // Usar service role key directamente para actualizaciones de admin
    // La autenticación ya se verifica en el layout de /admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

    // Recibir actualizaciones de orden
    const { updates } = await request.json()

    if (!Array.isArray(updates)) {
      console.log("[v0] Invalid updates format")
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 })
    }

    console.log(`[v0] Updating order for ${updates.length} bags:`, updates)

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
