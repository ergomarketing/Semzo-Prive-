import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { getMembershipPrice, validateMembershipType } from "@/lib/plan-config"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      giftCardId,
      billingCycle: rawBillingCycle,
      membershipType: rawMembershipType,
      // setupIntentId: tarjeta de garantia. Opcional para mantener
      // compatibilidad con flujos UI no migrados, pero RECOMENDADO.
      // Cuando viene, vinculamos la tarjeta al customer Stripe para
      // poder cobrar incidencias (no devolucion, daños, etc).
      setupIntentId,
    } = body
    const membershipType = rawMembershipType?.toLowerCase()
    const billingCycle = ["weekly", "monthly", "quarterly"].includes(rawBillingCycle)
      ? rawBillingCycle
      : "monthly"

    if (!userId || !giftCardId || !billingCycle || !membershipType) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: userId, giftCardId, billingCycle, membershipType" },
        { status: 400 },
      )
    }

    if (!validateMembershipType(membershipType)) {
      return NextResponse.json(
        { error: `Tipo de membresía inválido: ${membershipType}` },
        { status: 400 },
      )
    }

    const priceEuros = getMembershipPrice(membershipType, billingCycle)
    if (!priceEuros) {
      return NextResponse.json(
        { error: `Precio no encontrado para membresía: ${membershipType} / ${billingCycle}` },
        { status: 400 },
      )
    }

    const amountCents = Math.round(priceEuros * 100)

    // 1. Verificar gift card
    const { data: gc, error: gcErr } = await supabase
      .from("gift_cards")
      .select("id, amount, status")
      .eq("id", giftCardId)
      .single()

    if (gcErr || !gc) {
      return NextResponse.json({ error: "Gift card no encontrada" }, { status: 400 })
    }
    if (!["active", "partial"].includes(gc.status)) {
      return NextResponse.json({ error: "Gift card no está activa" }, { status: 400 })
    }
    if (gc.amount < amountCents) {
      return NextResponse.json({ error: "Saldo insuficiente en la gift card" }, { status: 400 })
    }

    // 2. Validar SetupIntent (tarjeta de garantía) ANTES de descontar saldo.
    // Si la validacion falla, NO se descuenta la gift card.
    let stripeCustomerId: string | null = null
    let stripePaymentMethodId: string | null = null
    let paymentMethodLast4: string | null = null
    let paymentMethodBrand: string | null = null

    if (setupIntentId) {
      try {
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

        if (setupIntent.status !== "succeeded") {
          return NextResponse.json(
            { error: "La tarjeta de garantía no se verificó correctamente. Inténtalo de nuevo." },
            { status: 400 },
          )
        }

        stripeCustomerId = (setupIntent.customer as string) || null
        stripePaymentMethodId = (setupIntent.payment_method as string) || null

        if (!stripeCustomerId || !stripePaymentMethodId) {
          return NextResponse.json(
            { error: "No se pudo recuperar la tarjeta de garantía. Inténtalo de nuevo." },
            { status: 400 },
          )
        }

        // Recuperar marca/last4 para mostrar al usuario
        const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId)
        paymentMethodLast4 = pm.card?.last4 || null
        paymentMethodBrand = pm.card?.brand || null

        // Guardar customer_id en profiles para futuras compras
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
          .eq("id", userId)
      } catch (siErr: any) {
        console.error("[gift-card] SetupIntent validation failed", siErr)
        return NextResponse.json(
          { error: "Error verificando la tarjeta de garantía: " + (siErr.message || "desconocido") },
          { status: 400 },
        )
      }
    }

    // 4. Calcular fecha de fin
    const endDate = new Date()
    if (billingCycle === "quarterly") endDate.setMonth(endDate.getMonth() + 3)
    else if (billingCycle === "weekly") endDate.setDate(endDate.getDate() + 7)
    else endDate.setMonth(endDate.getMonth() + 1)

    // 5. Upsert membresía (pending_verification hasta que complete Identity)
    const membershipPayload: Record<string, any> = {
      user_id: userId,
      membership_type: membershipType,
      billing_cycle: billingCycle,
      status: "pending_verification",
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString(),
      stripe_subscription_id: null,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
      payment_method_verified: !!stripePaymentMethodId,
      payment_method_last4: paymentMethodLast4,
      payment_method_brand: paymentMethodBrand,
      failed_payment_count: 0,
      dunning_status: null,
      updated_at: new Date().toISOString(),
    }

    const { error: membershipErr } = await supabase
      .from("user_memberships")
      .upsert(membershipPayload, { onConflict: "user_id" })

    if (membershipErr) {
      console.error("[gift-card] upsert error", {
        message: membershipErr.message,
        details: membershipErr.details,
        hint: membershipErr.hint,
        code: membershipErr.code,
        payload: membershipPayload,
      })
      return NextResponse.json(
        { error: "Error activando membresía: " + membershipErr.message },
        { status: 500 },
      )
    }

    // 5b. Descontar saldo SOLO despues de crear la membresia con exito.
    // Asi un fallo nunca deja la gift card gastada sin membresia (evita loop).
    const newAmount = gc.amount - amountCents
    await supabase
      .from("gift_cards")
      .update({
        amount: newAmount,
        status: newAmount <= 0 ? "used" : "partial",
        updated_at: new Date().toISOString(),
      })
      .eq("id", giftCardId)

    // 6. Sincronizar profiles
    await supabase
      .from("profiles")
      .update({
        membership_status: "pending_verification",
        membership_type: membershipType,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return NextResponse.json({
      success: true,
      message: "Membresía activada con gift card",
      payment_method_secured: !!stripePaymentMethodId,
    })
  } catch (error: any) {
    console.error("[purchase-with-gift-card] unexpected error", error)
    return NextResponse.json(
      { error: "Error inesperado: " + error.message },
      { status: 500 },
    )
  }
}
