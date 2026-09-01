/**
 * CRON JOB: Ejecutar cargos SEPA por no devolución (14 días tras aviso previo)
 *
 * Ejecuta diariamente. Busca reservas que:
 *  - Siguen en estado "overdue"
 *  - Recibieron el aviso previo obligatorio (sepa_pre_notice_sent_at) hace >= 14 días
 *  - No han sido cargadas todavía (sepa_charged_at IS NULL)
 *
 * Para cada una, ejecuta un cargo off-session con el mandato SEPA firmado por la socia
 * (profiles.sepa_payment_method_id) por el valor real del bolso (bags.retail_price).
 * Solo cobra si existe mandato SEPA guardado; si no, marca el fallo para revisión manual.
 *
 * Frecuencia: Diaria (sugerido: 10:00 AM CET, después de check-overdue-returns)
 * Endpoint: /api/cron/execute-sepa-charges
 */

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { sendSepaExecutionEmail, sendSepaExecutionAdminEmail } from "@/lib/emails/send-sepa-execution-email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NOTICE_PERIOD_DAYS = 14

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[SEPA CHARGE CRON] Iniciando ejecución de cargos SEPA vencidos...")

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - NOTICE_PERIOD_DAYS)

    const { data: dueReservations, error: reservationsError } = await supabaseAdmin
      .from("reservations")
      .select(
        `
        id,
        user_id,
        bag_id,
        end_date,
        total_amount,
        status,
        sepa_pre_notice_sent_at,
        sepa_charged_at,
        profiles!inner(id, email, full_name, first_name, last_name, stripe_customer_id, sepa_payment_method_id),
        bags!inner(id, name, brand, retail_price)
      `,
      )
      .in("status", ["overdue"])
      .not("sepa_pre_notice_sent_at", "is", null)
      .lte("sepa_pre_notice_sent_at", cutoff.toISOString())
      .is("sepa_charged_at", null)
      .is("sepa_charge_payment_intent_id", null)

    if (reservationsError) {
      console.error("[SEPA CHARGE CRON] Error consultando reservas:", reservationsError)
      return NextResponse.json({ success: false, error: reservationsError.message }, { status: 500 })
    }

    if (!dueReservations || dueReservations.length === 0) {
      console.log("[SEPA CHARGE CRON] No hay cargos pendientes de ejecutar")
      return NextResponse.json({ success: true, message: "No hay cargos pendientes", processed: 0 })
    }

    console.log(`[SEPA CHARGE CRON] ${dueReservations.length} reserva(s) cumplen el plazo de 14 días`)

    const results = []

    for (const reservation of dueReservations) {
      const profile = reservation.profiles as any
      const bag = reservation.bags as any

      if (!profile || !bag) {
        console.warn(`[SEPA CHARGE CRON] Reserva ${reservation.id}: datos incompletos, se omite`)
        continue
      }

      const customerName =
        profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Cliente"
      const bagName = `${bag.brand} ${bag.name}`.trim()
      const amount = Number(bag.retail_price) || Number(reservation.total_amount) || 500

      // Sin mandato SEPA firmado no se puede cobrar automáticamente: se marca para revisión manual.
      if (!profile.sepa_payment_method_id || !profile.stripe_customer_id) {
        console.warn(`[SEPA CHARGE CRON] Reserva ${reservation.id}: sin mandato SEPA, requiere revisión manual`)
        await supabaseAdmin
          .from("reservations")
          .update({
            sepa_charge_failed_at: new Date().toISOString(),
            sepa_charge_error: "Sin mandato SEPA guardado (profiles.sepa_payment_method_id vacío)",
          })
          .eq("id", reservation.id)

        results.push({ reservationId: reservation.id, success: false, error: "sin_mandato_sepa" })
        continue
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "eur",
          customer: profile.stripe_customer_id,
          payment_method: profile.sepa_payment_method_id,
          payment_method_types: ["sepa_debit"],
          off_session: true,
          confirm: true,
          description: `No devolución bolso ${bagName} — reserva ${reservation.id}`,
          metadata: {
            reservation_id: reservation.id,
            bag_id: reservation.bag_id,
            user_id: reservation.user_id,
            reason: "non_return_sepa_mandate",
          },
        })

        if (paymentIntent.status === "succeeded" || paymentIntent.status === "processing") {
          await supabaseAdmin
            .from("reservations")
            .update({
              sepa_charged_at: new Date().toISOString(),
              sepa_charge_amount: amount,
              sepa_charge_payment_intent_id: paymentIntent.id,
            })
            .eq("id", reservation.id)

          if (profile.email) {
            await sendSepaExecutionEmail({
              to: profile.email,
              customerName,
              bagName,
              amountCharged: amount,
              reservationId: reservation.id,
              paymentIntentId: paymentIntent.id,
            })
          }

          await sendSepaExecutionAdminEmail({
            customerName,
            customerEmail: profile.email || "sin email",
            bagName,
            amountCharged: amount,
            reservationId: reservation.id,
            paymentIntentId: paymentIntent.id,
          })

          console.log(`[SEPA CHARGE CRON] ✅ Cargo ejecutado para reserva ${reservation.id}: ${amount}€`)
          results.push({ reservationId: reservation.id, success: true, amount, paymentIntentId: paymentIntent.id })
        } else {
          throw new Error(`Estado inesperado del PaymentIntent: ${paymentIntent.status}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        console.error(`[SEPA CHARGE CRON] Error cobrando reserva ${reservation.id}:`, errorMessage)

        await supabaseAdmin
          .from("reservations")
          .update({
            sepa_charge_failed_at: new Date().toISOString(),
            sepa_charge_error: errorMessage,
          })
          .eq("id", reservation.id)

        results.push({ reservationId: reservation.id, success: false, error: errorMessage })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    console.log(`[SEPA CHARGE CRON] Completado: ${successCount} cobrados, ${failCount} fallidos/sin mandato`)

    return NextResponse.json({
      success: true,
      processed: dueReservations.length,
      charged: successCount,
      failed: failCount,
      results,
    })
  } catch (error) {
    console.error("[SEPA CHARGE CRON] Error crítico:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
