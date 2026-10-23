import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getCreditBalanceCents } from "@/lib/ownership-credit-carry"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/user/ownership/credit-balance
 * Saldo de credito Colecciona de la socia (euros): todo lo acumulado que no se ha perdido ni gastado en una
 * compra. Es saldo de la socia, no de un bolso: sobrevive a renunciar o cambiar de bolso.
 */
export async function GET() {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const cents = await getCreditBalanceCents(supabaseAdmin, user.id)
    return NextResponse.json({ balance: Math.round(cents) / 100 })
  } catch (err) {
    console.error("[ownership/credit-balance] error:", err)
    return NextResponse.json({ balance: 0 })
  }
}
