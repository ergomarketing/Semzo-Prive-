/**
 * CRON JOB: Ejecutar cargos SEPA por no devolución (inmediatamente tras el aviso previo)
 *
 * Ejecuta diariamente, después de check-overdue-returns. Busca reservas que:
 *  - Siguen en estado "overdue"
 *  - Ya recibieron el aviso previo obligatorio (sepa_pre_notice_sent_at no nulo)
 *  - No han sido cargadas todavía (sepa_charged_at IS NULL)
 *
 * Ya no hay espera adicional tras el aviso: se cobra en la primera pasada del cron
 * posterior al envío. Antes de cobrar se re-verifica que la socia siga acumulando
 * >= 3 pagos de membresía fallidos (por si pagó la membresía entre el aviso y el cargo);
 * si ya no cumple la condición, se omite el cargo para revisión manual.
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
import { adminNotifications } from "@/lib/admin-notifications"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIN_FAILED_PAYMENTS = 3

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

    // Re-verificar que la condición de 3 pagos fallidos siga vigente (pudo pagar entre el aviso y hoy)
    const candidateUserIds = [...new Set(dueReservations.map((r) => r.user_id))]
    const { data: strugglingMemberships, error: membershipsError } = await supabaseAdmin
      .from("user_memberships")
      .select("user_id, failed_payment_count")
      .in("user_id", candidateUserIds)
      .gte("failed_payment_count", MIN_FAILED_PAYMENTS)

    if (membershipsError) {
      console.error("[SEPA CHARGE CRON] Error consultando membresías:", membershipsError)
      return NextResponse.json({ success: false, error: membershipsError.message }, { status: 500 })
    }

    const strugglingUserIds = new Set((strugglingMemberships || []).map((m) => m.user_id))

    console.log(`[SEPA CHARGE CRON] ${dueReservations.length} reserva(s) con aviso enviado, verificando condición vigente`)

    const results = []

    for (const reservation of dueReservations) {
      const profile = reservation.profiles as any
      const bag = reservation.bags as any

      if (!profile || !bag) {
        console.warn(`[SEPA CHARGE CRON] Reserva ${reservation.id}: datos incompletos, se omite`)
        continue
      }

      // La socia ya no acumula >= 3 pagos fallidos (p. ej. puso al día la membresía): no se cobra, requiere revisión manual
      if (!strugglingUserIds.has(reservation.user_id)) {
        console.log(
          `[SEPA CHARGE CRON] Reserva ${reservation.id}: la socia ya no cumple la condición de 3 pagos fallidos, se omite el cargo`,
        )
        results.push({ reservationId: reservation.id, success: false, error: "condicion_ya_no_vigente" })
        continue
      }

      const customerName =
        profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Cliente"
      const bagName = `${bag.brand} ${bag.name}`.trim()
      const amount = Number(bag.retail_price) || Number(reservation.total_amount) || 500

      // Sin mandato SEPA firmado no se puede cobrar automáticamente: se marca para revisión manual.
      if (!profile.sepa_payment_method_id || !profile.stripe_customer_id) {
        console.warn(`[SEPA CHARGE CRON] Reserva ${reservation.id}: sin mandato SEPA, requiere revisión manual`)
        const noMandateError = "Sin mandato SEPA guardado (profiles.sepa_payment_method_id vacío)"
        await supabaseAdmin
          .from("reservations")
          .update({
            sepa_charge_failed_at: new Date().toISOString(),
            sepa_charge_error: noMandateError,
          })
          .eq("id", reservation.id)

        await adminNotifications
          .notifySepaChargeFailed({
            userName: customerName,
            userEmail: profile.email || "sin email",
            bagName,
            bagBrand: bag.brand,
            reservationId: reservation.id,
            amount,
            reason: "sin_mandato_sepa",
            errorDetail: noMandateError,
          })
          .catch((err) => console.error("[SEPA CHARGE CRON] Error notificando al admin:", err))

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

        await adminNotifications
          .notifySepaChargeFailed({
            userName: customerName,
            userEmail: profile.email || "sin email",
            bagName,
            bagBrand: bag.brand,
            reservationId: reservation.id,
            amount,
            reason: "error_stripe",
            errorDetail: errorMessage,
          })
          .catch((err) => console.error("[SEPA CHARGE CRON] Error notificando al admin:", err))

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
