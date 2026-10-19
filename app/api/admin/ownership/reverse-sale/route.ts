import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { requireAdminAuth } from "@/lib/admin-auth"
import { reverseColeccionaSale } from "@/lib/ownership-reverse-sale"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion })

/**
 * POST /api/admin/ownership/reverse-sale
 * Body: { progress_id, confirm?: boolean, reason?: string, bag_returned?: boolean }
 *
 * Anula una venta Colecciona (desistimiento). Sin confirm solo devuelve el plan (no toca Stripe ni la base de
 * datos); con confirm: true crea la nota de credito, reembolsa y deja a la socia como antes de comprar.
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.progress_id) return NextResponse.json({ error: "Falta progress_id" }, { status: 400 })

    const result = await reverseColeccionaSale(supabaseAdmin, stripe, {
      progressId: String(body.progress_id),
      confirm: body.confirm === true,
      reason: typeof body.reason === "string" ? body.reason : undefined,
      bagReturned: body.bag_returned === true,
    })
    if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: 409 })
    return NextResponse.json(result)
  } catch (err) {
    console.error("[colecciona-reverse] error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error al anular la venta" }, { status: 500 })
  }
}
