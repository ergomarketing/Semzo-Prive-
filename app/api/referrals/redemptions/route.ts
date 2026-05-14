import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@/lib/supabase"

/**
 * GET /api/referrals/redemptions
 *
 * Devuelve historial de canjes del usuario autenticado.
 * Lectura via cookie/RLS - el propio usuario solo ve sus filas.
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("referral_redemptions")
      .select("id, amount_euros, status, created_at, applied_at, failure_reason")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] redemptions list error:", error)
      return NextResponse.json({ error: "db_error" }, { status: 500 })
    }

    return NextResponse.json({ redemptions: data ?? [] })
  } catch (err: any) {
    console.error("[v0] redemptions fatal:", err?.message)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
