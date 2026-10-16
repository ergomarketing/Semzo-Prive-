import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { requireAdminAuth } from "@/lib/admin-auth"
import { simulateConversion } from "@/lib/ownership-credit-ledger"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
})

/**
 * GET /api/admin/ownership/simulate-conversion?email=...[&bag_id=...]
 *
 * SIMULACION de solo lectura: calcula que credito recibiria la socia al convertir
 * a Modo Colecciona. No escribe en la base de datos ni en Stripe.
 * Si no se indica bag_id se usa el bolso de su progreso activo o, si no, el del ultimo.
 */
export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  try {
    const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase()
    let userId = req.nextUrl.searchParams.get("user_id")?.trim() || null
    let bagId = req.nextUrl.searchParams.get("bag_id")?.trim() || null

    if (!userId) {
      if (!email) {
        return NextResponse.json({ error: "email o user_id requerido" }, { status: 400 })
      }
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle()
      if (!profile) return NextResponse.json({ error: "Socia no encontrada" }, { status: 404 })
      userId = profile.id
    }

    if (!bagId) {
      const { data: lastProgress } = await supabaseAdmin
        .from("ownership_progress")
        .select("bag_id")
        .eq("user_id", userId)
        .order("status", { ascending: true })
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      bagId = lastProgress?.bag_id ?? null
    }
    if (!bagId) return NextResponse.json({ error: "bag_id requerido (la socia no tiene progreso)" }, { status: 400 })

    const { data: bag } = await supabaseAdmin
      .from("bags")
      .select("id, brand, name, purchase_price")
      .eq("id", bagId)
      .maybeSingle()
    if (!bag || bag.purchase_price == null) {
      return NextResponse.json({ error: "El bolso no existe o no tiene precio de compra" }, { status: 400 })
    }

    const simulation = await simulateConversion(supabaseAdmin, stripe, userId!, bag.id, Number(bag.purchase_price))
    return NextResponse.json({
      simulation: true,
      user_id: userId,
      bag: { id: bag.id, brand: bag.brand, name: bag.name },
      ...simulation,
    })
  } catch (err) {
    console.error("[v0] simulate-conversion error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 })
  }
}
