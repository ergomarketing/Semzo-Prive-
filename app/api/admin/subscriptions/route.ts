import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

/**
 * Admin: lista todas las suscripciones / membresias relevantes.
 * Fuente de verdad: user_memberships (NO la tabla legacy `subscriptions`).
 *
 * Devuelve TODAS las membresias con cualquier estado (excepto las free)
 * para que el panel admin pueda ver historico, canceladas, pendientes,
 * etc. La pagina filtra/segmenta visualmente.
 */
export async function GET() {
  try {
    const supabaseUrl =
      process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase configuration missing" },
        { status: 500 },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1) Traer membresias (sin FK join hardcoded para evitar fallos
    //    silenciosos cuando la FK tiene otro nombre).
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from("user_memberships")
      .select(
        "id, user_id, membership_type, billing_cycle, status, can_make_reservations, cancel_at_period_end, current_period_end, start_date, end_date, stripe_subscription_id, stripe_customer_id, stripe_payment_method_id, payment_method_last4, payment_method_brand, created_at, updated_at",
      )
      .neq("membership_type", "free")
      .order("created_at", { ascending: false })

    if (membershipsError) {
      console.error("[admin/subscriptions] user_memberships error:", membershipsError)
      return NextResponse.json(
        { error: "Error leyendo membresias", details: membershipsError.message },
        { status: 500 },
      )
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json([])
    }

    // 2) Traer perfiles asociados en una sola query (evita problemas de FK).
    const userIds = [...new Set(memberships.map((m) => m.user_id).filter(Boolean))]
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)

    if (profilesError) {
      console.error("[admin/subscriptions] profiles error:", profilesError)
    }

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

    // 3) Por cada membresia, si tiene stripe_subscription_id, verificar
    //    estado real en Stripe (con timeout corto y captura de error para
    //    no bloquear toda la lista por un fallo puntual).
    const enriched = await Promise.all(
      memberships.map(async (m) => {
        let stripeVerifiedStatus: string | null = null
        let stripeData: {
          status: string
          current_period_end: string
          cancel_at_period_end: boolean
        } | null = null

        if (m.stripe_subscription_id) {
          try {
            const sub = await stripe.subscriptions.retrieve(m.stripe_subscription_id)
            stripeVerifiedStatus = sub.status
            stripeData = {
              status: sub.status,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
            }
          } catch (e: any) {
            console.log(
              `[admin/subscriptions] stripe.subscriptions.retrieve failed for ${m.stripe_subscription_id}:`,
              e?.message,
            )
            stripeVerifiedStatus = "error"
          }
        } else {
          // Sin subscription_id => pago directo (gift card 100%, etc.)
          stripeVerifiedStatus = "direct_payment"
        }

        // Comparacion de match: si Stripe dice "active" y nosotros tambien
        // contamos como match. Para gift card directa no hay nada que
        // comparar, asi que lo damos como match.
        const statusMatch =
          stripeVerifiedStatus === "direct_payment" ||
          stripeVerifiedStatus === "error" ||
          stripeVerifiedStatus === m.status ||
          // Caso tipico: BD "active" y Stripe "active" + cancel_at_period_end=true
          (stripeVerifiedStatus === "active" && m.status === "active")

        return {
          id: m.id,
          user_id: m.user_id,
          stripe_subscription_id: m.stripe_subscription_id,
          stripe_customer_id: m.stripe_customer_id,
          membership_type: m.membership_type,
          billing_cycle: m.billing_cycle,
          status: m.status,
          can_make_reservations: m.can_make_reservations,
          cancel_at_period_end:
            (stripeData?.cancel_at_period_end ?? m.cancel_at_period_end) || false,
          current_period_start: m.start_date,
          current_period_end: stripeData?.current_period_end || m.current_period_end || m.end_date,
          payment_method_last4: m.payment_method_last4,
          payment_method_brand: m.payment_method_brand,
          created_at: m.created_at,
          updated_at: m.updated_at,
          profiles: profilesMap.get(m.user_id) || null,
          stripe_verified_status: stripeVerifiedStatus,
          status_match: statusMatch,
          stripe_data: stripeData,
        }
      }),
    )

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("[admin/subscriptions] unexpected error:", error)
    return NextResponse.json(
      { error: "Error interno", details: error?.message },
      { status: 500 },
    )
  }
}
