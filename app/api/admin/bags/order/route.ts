import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    // Usar SUPABASE_SERVICE_ROLE_KEY si existe, sino usar anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Missing Supabase env vars - URL:", !!supabaseUrl, "KEY:", !!supabaseKey)
      return NextResponse.json({ error: "Configuracion de servidor incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Recibir actualizaciones de orden
    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates)) {
      console.log("[v0] Invalid updates format:", typeof updates, body)
      return NextResponse.json({ error: "Formato invalido" }, { status: 400 })
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: "Sin cambios" })
    }

    console.log(`[v0] Updating order for ${updates.length} bags`)

    // Actualizar display_order individualmente para cada bolso
    for (const u of updates as { id: string; display_order: number }[]) {
      console.log(`[v0] Updating bag ${u.id} to order ${u.display_order}`)
      
      const { error: updateError } = await supabase
        .from("bags")
        .update({ display_order: u.display_order })
        .eq("id", u.id)

      if (updateError) {
        console.error("[v0] Error updating bag order for id", u.id, ":", updateError.message)
        return NextResponse.json({ 
          error: `Error actualizando bolso: ${updateError.message}` 
        }, { status: 500 })
      }
    }

    // Revalidar páginas del catálogo
    try {
      revalidatePath("/catalog")
      revalidatePath("/")
    } catch (revalidateError) {
      console.log("[v0] revalidatePath skipped")
    }

    console.log("[v0] Bag order updated successfully")

    return NextResponse.json({
      success: true,
      message: "Orden actualizado correctamente",
    })
  } catch (error) {
    console.error("[v0] Error updating bag order:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: `Error al guardar el orden: ${message}` }, { status: 500 })
  }
}
