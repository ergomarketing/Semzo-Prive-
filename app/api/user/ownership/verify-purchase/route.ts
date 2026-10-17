import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { closeColeccionaSale } from "@/lib/ownership-sale-close"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/user/ownership/verify-purchase?session_id=cs_...
 *
 * Lo usa /post-checkout/colecciona al volver de Stripe. Consulta la sesion en Stripe
 * (solo de la propia socia) y, si esta pagada, cierra la venta sin esperar al webhook.
 * El cierre es idempotente: si el webhook ya lo hizo, no repite nada.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id")
    if (!sessionId) return NextResponse.json({ error: "Falta session_id" }, { status: 400 })

    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.type !== "colecciona_purchase" || session.metadata?.user_id !== user.id) {
      return NextResponse.json({ status: "not_found" }, { status: 404 })
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: session.status === "expired" ? "failed" : "pending" })
    }

    const progressId = session.metadata?.ownership_progress_id
    if (!progressId) return NextResponse.json({ status: "not_found" }, { status: 404 })

    const result = await closeColeccionaSale(supabaseAdmin, {
      progressId,
      amountPaidCents: session.amount_total || 0,
      paymentRef: session.id,
    })

    if (!result.ok) return NextResponse.json({ status: "error", reason: result.reason }, { status: 409 })
    return NextResponse.json({ status: "completed", bagLabel: result.bagLabel })
  } catch (err) {
    console.error("[colecciona-verify] error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error verificando el pago" }, { status: 500 })
  }
}
