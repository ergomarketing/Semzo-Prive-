/**
 * GET /api/user/subscription-summary
 *
 * Endpoint AISLADO y SOLO LECTURA que enriquece los datos básicos
 * de membresía con información viva de Stripe:
 *  - ID amigable (SP-XXXXXX)
 *  - Fecha de próximo cobro (current_period_end)
 *  - Método de pago (brand + last4 + exp)
 *  - Estado de la suscripción en Stripe
 *
 * NO modifica nada. NO toca webhooks. NO toca el sistema de pagos.
 * Si algo falla en Stripe, devuelve solo los datos de Supabase.
 *
 * Usado por el componente <SubscriptionSummaryCard /> en el dashboard.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import Stripe from "stripe"
import { formatSubscriptionId } from "@/lib/format-subscription-id"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion,
})

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // 1. Leer perfil (created_at fallback para fecha de alta)
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, created_at")
      .eq("id", user.id)
      .single()

    // 2. Leer membresía más reciente - SOLO columnas garantizadas (la query
    //    que ya funcionaba antes). NO TOCAR esto.
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("membership_type, status, billing_cycle, start_date, end_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3a. Query GARANTIZADA: Stripe IDs (columnas que siempre existen)
    const { data: stripeIds } = await supabase
      .from("user_memberships")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3b. Query OPCIONAL: columnas extras que podrian no existir en BD.
    //     Si falla por columna inexistente, NO rompe los Stripe IDs.
    let extras: {
      current_period_end: string | null
      payment_method_brand: string | null
      payment_method_last4: string | null
      cancel_at_period_end: boolean | null
    } | null = null
    const { data: extrasData, error: extrasError } = await supabase
      .from("user_memberships")
      .select(
        "current_period_end, payment_method_brand, payment_method_last4, cancel_at_period_end",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!extrasError && extrasData) {
      extras = extrasData as typeof extras
    }

    // Stripe IDs: priorizar user_memberships, fallback a profiles
    const stripeSubId =
      stripeIds?.stripe_subscription_id || profile?.stripe_subscription_id || null
    const stripeCustomerId =
      stripeIds?.stripe_customer_id || profile?.stripe_customer_id || null

    // ID amigable (no depende de Stripe online)
    const friendlyId = formatSubscriptionId(stripeSubId)

    // Fecha de alta = la más temprana entre membership.start_date / created_at / profile.created_at
    const memberSince =
      membership?.start_date || membership?.created_at || profile?.created_at || null

    // Metodo de pago desde cache de BD (fallback inmediato si Stripe no responde)
    const cachedPaymentMethod =
      extras?.payment_method_brand && extras?.payment_method_last4
        ? {
            brand: extras.payment_method_brand,
            last4: extras.payment_method_last4,
            exp_month: 0,
            exp_year: 0,
          }
        : null

    // Proximo cobro desde BD (current_period_end cacheado)
    const cachedNextCharge = extras?.current_period_end || null

    // Respuesta base (siempre disponible, aunque Stripe falle)
    const base = {
      friendly_id: friendlyId,
      member_since: memberSince,
      membership_type: membership?.membership_type || null,
      billing_cycle: membership?.billing_cycle || null,
      end_date: membership?.end_date || null,
      cancel_at_period_end: extras?.cancel_at_period_end || false,
      membership_status: membership?.status || null,
      next_charge_at: cachedNextCharge as string | null,
      stripe_status: null as string | null,
      payment_method: cachedPaymentMethod as {
        brand: string
        last4: string
        exp_month: number
        exp_year: number
      } | null,
      stripe_available: false,
    }

    // 3. Si no hay suscripción en Stripe, devolver solo lo básico
    if (!stripeSubId) {
      return NextResponse.json(base, {
        headers: { "Cache-Control": "no-store" },
      })
    }

    // 4. Intentar enriquecer con Stripe (en paralelo) sin romper si falla
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubId, {
        expand: ["default_payment_method", "items.data.price"],
      })

      // Fecha del próximo cobro
      const nextChargeAt = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null

      // Método de pago: primero del subscription, fallback al customer.invoice_settings
      let paymentMethod: typeof base.payment_method = null

      const subPm = subscription.default_payment_method
      if (subPm && typeof subPm !== "string" && subPm.card) {
        paymentMethod = {
          brand: subPm.card.brand,
          last4: subPm.card.last4,
          exp_month: subPm.card.exp_month,
          exp_year: subPm.card.exp_year,
        }
      } else if (stripeCustomerId) {
        // Fallback: leer del customer
        try {
          const customer = await stripe.customers.retrieve(stripeCustomerId, {
            expand: ["invoice_settings.default_payment_method"],
          })
          if (
            customer &&
            !customer.deleted &&
            customer.invoice_settings?.default_payment_method &&
            typeof customer.invoice_settings.default_payment_method !== "string"
          ) {
            const pm = customer.invoice_settings.default_payment_method
            if (pm.card) {
              paymentMethod = {
                brand: pm.card.brand,
                last4: pm.card.last4,
                exp_month: pm.card.exp_month,
                exp_year: pm.card.exp_year,
              }
            }
          }
        } catch {
          // ignorar, dejamos paymentMethod = null
        }
      }

      return NextResponse.json(
        {
          ...base,
          next_charge_at: nextChargeAt,
          stripe_status: subscription.status,
          payment_method: paymentMethod,
          stripe_available: true,
        },
        { headers: { "Cache-Control": "no-store" } },
      )
    } catch (stripeError: any) {
      console.error("[subscription-summary] Stripe error:", stripeError?.message || stripeError)
      // Stripe falló → devolver solo datos de Supabase
      return NextResponse.json(base, { headers: { "Cache-Control": "no-store" } })
    }
  } catch (error: any) {
    console.error("[subscription-summary] Error:", error?.message || error)
    return NextResponse.json({ error: "Error al cargar resumen" }, { status: 500 })
  }
}
