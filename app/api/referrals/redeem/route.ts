import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createRouteHandlerClient } from "@/lib/supabase"
import { getSupabaseServiceRole } from "@/lib/supabase-server"

/**
 * POST /api/referrals/redeem
 *
 * Canje de credito de referidos. Crea una transaccion de balance en
 * Stripe (customer balance transaction) que Stripe aplica automaticamente
 * a la proxima factura del cliente, sin tocar la suscripcion ni el
 * checkout actual.
 *
 * Flujo atomico:
 *   1) Reserva en BD: descuenta el saldo y crea fila pending (RPC).
 *      Si falla, no se ha llamado a Stripe todavia.
 *   2) Stripe.customers.createBalanceTransaction con amount NEGATIVO
 *      (credito). Stripe descontara este importe de la proxima factura.
 *   3) Si Stripe falla: revertir la reserva (devolver saldo).
 *      Si Stripe responde OK: marcar applied + guardar tx_id.
 *
 * Body: { amount?: number }   // default 50, multiplos de 50, max 500
 * Auth: cookie de Supabase (usuario autenticado).
 */

// Cliente Stripe propio (no compartido con webhooks).
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const MIN_AMOUNT = 50
const MAX_AMOUNT = 500
const ALLOWED_STEP = 50

export async function POST(request: NextRequest) {
  try {
    // 1) Auth.
    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
    }

    // 2) Validar amount.
    const body = await request.json().catch(() => ({}))
    const amount = Number(body?.amount ?? MIN_AMOUNT)

    if (
      !Number.isInteger(amount) ||
      amount < MIN_AMOUNT ||
      amount > MAX_AMOUNT ||
      amount % ALLOWED_STEP !== 0
    ) {
      return NextResponse.json(
        { ok: false, reason: "invalid_amount", message: `Importe debe ser multiplo de ${ALLOWED_STEP}€ entre ${MIN_AMOUNT}€ y ${MAX_AMOUNT}€` },
        { status: 400 },
      )
    }

    const admin = getSupabaseServiceRole()
    if (!admin) {
      return NextResponse.json({ ok: false, reason: "db_unavailable" }, { status: 500 })
    }

    // 3) Reserva atomica en BD (descuenta saldo + crea fila pending).
    const { data: reserved, error: rpcError } = await admin.rpc(
      "reserve_referral_redemption",
      { p_user_id: user.id, p_amount_euros: amount },
    )

    if (rpcError) {
      const msg = rpcError.message || ""
      console.error("[v0] redeem rpc error:", rpcError)
      if (msg.includes("insufficient_balance")) {
        return NextResponse.json({ ok: false, reason: "insufficient_balance" }, { status: 400 })
      }
      if (msg.includes("no_stripe_customer")) {
        return NextResponse.json({ ok: false, reason: "no_stripe_customer" }, { status: 400 })
      }
      if (msg.includes("uniq_redemption_pending_per_user")) {
        return NextResponse.json({ ok: false, reason: "another_pending" }, { status: 409 })
      }
      return NextResponse.json({ ok: false, reason: "reserve_failed" }, { status: 500 })
    }

    const row = Array.isArray(reserved) ? reserved[0] : reserved
    const redemptionId = row?.redemption_id as string
    const newBalance = row?.new_balance as number

    if (!redemptionId) {
      return NextResponse.json({ ok: false, reason: "reserve_failed" }, { status: 500 })
    }

    // 4) Obtener customer_id para crear el balance transaction en Stripe.
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle()

    const stripeCustomerId = profile?.stripe_customer_id
    if (!stripeCustomerId) {
      await admin.rpc("revert_referral_redemption", {
        p_redemption_id: redemptionId,
        p_reason: "no_stripe_customer",
      })
      return NextResponse.json({ ok: false, reason: "no_stripe_customer" }, { status: 400 })
    }

    // 5) Stripe: crear credito en el balance del cliente.
    //    amount NEGATIVO = credito que Stripe aplicara a la proxima factura.
    //    Stripe procesa esto automaticamente en cada renovacion.
    try {
      const tx = await stripe.customers.createBalanceTransaction(stripeCustomerId, {
        amount: -1 * amount * 100, // negativo, en centimos
        currency: "eur",
        description: `Credito referidos Semzo Prive - ${amount}EUR`,
        metadata: {
          source: "referrals",
          redemption_id: redemptionId,
          user_id: user.id,
        },
      })

      // 6) Confirmar en BD.
      await admin.rpc("mark_referral_redemption_applied", {
        p_redemption_id: redemptionId,
        p_stripe_tx_id: tx.id,
      })

      return NextResponse.json({
        ok: true,
        redemptionId,
        appliedAmount: amount,
        newBalance,
        stripeBalanceTxId: tx.id,
        message: `${amount}€ se aplicaran automaticamente en tu proxima factura.`,
      })
    } catch (stripeErr: any) {
      // Revertir saldo: el cobro NO se aplico en Stripe.
      console.error("[v0] redeem stripe error:", stripeErr?.message)
      await admin.rpc("revert_referral_redemption", {
        p_redemption_id: redemptionId,
        p_reason: stripeErr?.message ?? "stripe_error",
      })
      return NextResponse.json(
        { ok: false, reason: "stripe_error", message: stripeErr?.message ?? "Error con Stripe" },
        { status: 502 },
      )
    }
  } catch (err: any) {
    console.error("[v0] redeem fatal:", err?.message)
    return NextResponse.json({ ok: false, reason: "internal_error" }, { status: 500 })
  }
}
