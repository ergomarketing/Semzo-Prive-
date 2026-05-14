import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * POST /api/user/ownership/convert-to-collect
 *
 * Convertir el bolso actual de Modo Descubre a Modo Colecciona.
 * El credito acumulado empieza desde 0 desde este momento.
 * Requiere que el bolso tenga purchase_price configurado.
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const bagId = body.bag_id as string | undefined
    if (!bagId) {
      return NextResponse.json({ error: "bag_id requerido" }, { status: 400 })
    }

    // Verificar que el bolso tiene precio
    const { data: bag } = await supabaseAdmin
      .from("bags")
      .select("id, purchase_price")
      .eq("id", bagId)
      .maybeSingle()

    if (!bag || bag.purchase_price == null) {
      return NextResponse.json(
        { error: "Este bolso no está disponible en Modo Colecciona" },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()

    // Cerrar discover activo
    await supabaseAdmin
      .from("ownership_progress")
      .update({ status: "cancelled", updated_at: now })
      .eq("user_id", user.id)
      .eq("bag_id", bagId)
      .eq("status", "active")

    // Crear nuevo registro collect desde 0
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("ownership_progress")
      .insert({
        user_id: user.id,
        bag_id: bagId,
        mode: "collect",
        purchase_price: bag.purchase_price,
        accumulated: 0,
        status: "active",
      })
      .select("id")
      .single()

    if (insertErr) {
      console.error("[v0] convert-to-collect insert error:", insertErr)
      return NextResponse.json({ error: "No se pudo crear el progreso" }, { status: 500 })
    }

    return NextResponse.json({ success: true, ownership_progress_id: created.id })
  } catch (err) {
    console.error("[v0] ownership/convert-to-collect error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
