import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 8a del flujo de suscripcion: CREAR SETUP INTENT DE SEPA
 *
 * - Crea customer en Stripe si no existe (con email, nombre, telefono)
 * - Crea SetupIntent con:
 *     payment_method_types: ["sepa_debit"]
 *     usage: "off_session"
 *     mandate_data con customer_acceptance type "online" (ip + user_agent)
 *     metadata.purpose: "sepa_mandate_for_incidences"
 *
 * Devuelve clientSecret que el front usa con confirmSepaDebitSetup.
 * ============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, email, full_name, phone")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    let stripeCustomerId = profile.stripe_customer_id

    // Crear customer en Stripe si no existe
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile.email || undefined,
        name: profile.full_name || undefined,
        phone: profile.phone || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      stripeCustomerId = customer.id

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id)
    }

    // Crear SetupIntent para SEPA Direct Debit
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["sepa_debit"],
      usage: "off_session",
      mandate_data: {
        customer_acceptance: {
          type: "online",
          online: {
            ip_address: request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
            user_agent: request.headers.get("user-agent") || "unknown",
          },
        },
      },
      metadata: {
        user_id: user.id,
        purpose: "sepa_mandate_for_incidences",
      },
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    })
  } catch (error: any) {
    console.error("[SEPA Setup Intent] Error:", error)
    return NextResponse.json({ error: error.message || "Error creando setup intent SEPA" }, { status: 500 })
  }
}
