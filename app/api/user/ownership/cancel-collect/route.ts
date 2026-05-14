import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * POST /api/user/ownership/cancel-collect
 *
 * Renunciar a la compra rent-to-own del bolso actual.
 * Marca el ownership_progress como cancelled (se pierde el credito acumulado).
 * No toca la reserva del bolso ni la suscripcion: la socia puede pedir cambio
 * de bolso normalmente despues.
 */
export async function POST(_req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: progress } = await supabaseAdmin
      .from("ownership_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("mode", "collect")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!progress) {
      return NextResponse.json({ error: "No hay compra activa" }, { status: 404 })
    }

    const now = new Date().toISOString()
    await supabaseAdmin
      .from("ownership_progress")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", progress.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[v0] ownership/cancel-collect error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
