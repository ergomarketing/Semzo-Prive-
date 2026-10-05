import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * GET /api/stripe/verify-bag-purchase?session_id=...
 * Consulta si el webhook ya marcó el bolso como vendido (status "colecciona").
 * Usado por /post-checkout/bag-purchase para hacer polling tras el pago.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Falta session_id" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const bagId = session.metadata?.bag_id

    if (!bagId) {
      return NextResponse.json({ status: "not_found" })
    }

    const { data: bag } = await supabaseAdmin.from("bags").select("name, brand, status").eq("id", bagId).maybeSingle()

    if (bag?.status === "colecciona") {
      return NextResponse.json({
        status: "completed",
        bagLabel: `${bag.brand || ""} ${bag.name || ""}`.trim(),
      })
    }

    return NextResponse.json({ status: "pending" })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error verificando sesión" }, { status: 500 })
  }
}
