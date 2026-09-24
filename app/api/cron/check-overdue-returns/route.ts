/**
 * CRON JOB: Verificar devoluciones vencidas (8 días) + señal de riesgo de pago
 *
 * Ejecuta diariamente. El aviso previo obligatorio de SEPA solo se envía cuando
 * se cumplen AMBAS condiciones a la vez:
 *  - La reserva lleva >= 8 días vencida (end_date + 8 días <= ahora)
 *  - La socia muestra una señal de riesgo de pago: o bien acumula >= 3 intentos
 *    de pago de membresía fallidos (user_memberships.failed_payment_count), o
 *    bien YA NO tiene una membresía vigente que seguir cobrando (cancelled/
 *    expired/sin fila en user_memberships). Este segundo caso cierra el vacío
 *    de "cancelo la membresía en paz para no acumular nunca los 3 fallos y
 *    quedarme con el bolso sin que el seguro SEPA se active jamás".
 *
 * Si la socia devuelve el bolso o pone al día su membresía antes de este punto, no se envía aviso.
 *
 * Frecuencia: Diaria (sugerido: 10:00 AM CET)
 * Endpoint: /api/cron/check-overdue-returns
 */

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { sendSepaPreExecutionEmail } from "@/lib/emails/send-sepa-pre-execution-email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const OVERDUE_DAYS = 8
const MIN_FAILED_PAYMENTS = 3

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización del cron (opcional pero recomendado)
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[SEPA CRON] Iniciando verificación de devoluciones vencidas...")

    // Buscar reservas vencidas hace >= 8 días que no hayan recibido aviso todavía
    const now = new Date()
    const overdueCutoff = new Date(now)
    overdueCutoff.setDate(overdueCutoff.getDate() - OVERDUE_DAYS)

    const { data: overdueReservations, error: reservationsError } = await supabaseAdmin
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
        profiles!inner(id, email, full_name, first_name, last_name),
        bags!inner(id, name, brand, retail_price)
      `,
      )
      .in("status", ["overdue"])
      .lte("end_date", overdueCutoff.toISOString())
      .is("sepa_pre_notice_sent_at", null)

    if (reservationsError) {
      console.error("[SEPA CRON] Error consultando reservas:", reservationsError)
      return NextResponse.json(
        {
          success: false,
          error: reservationsError.message,
        },
        { status: 500 },
      )
    }

    if (!overdueReservations || overdueReservations.length === 0) {
      console.log("[SEPA CRON] No hay devoluciones vencidas >= 8 días pendientes de aviso")
      return NextResponse.json({
        success: true,
        message: "No hay devoluciones vencidas",
        processed: 0,
      })
    }

    // De esas reservas, solo interesan las socias con >= 3 pagos de membresía fallidos
    const candidateUserIds = [...new Set(overdueReservations.map((r) => r.user_id))]
    const { data: strugglingMemberships, error: membershipsError } = await supabaseAdmin
      .from("user_memberships")
      .select("user_id, failed_payment_count")
      .in("user_id", candidateUserIds)
      .gte("failed_payment_count", MIN_FAILED_PAYMENTS)

    if (membershipsError) {
      console.error("[SEPA CRON] Error consultando membresías:", membershipsError)
      return NextResponse.json({ success: false, error: membershipsError.message }, { status: 500 })
    }

    const strugglingUserIds = new Set((strugglingMemberships || []).map((m) => m.user_id))
    const eligibleReservations = overdueReservations.filter((r) => strugglingUserIds.has(r.user_id))

    if (eligibleReservations.length === 0) {
      console.log("[SEPA CRON] Ninguna socia con reserva vencida >= 8 días acumula >= 3 pagos fallidos")
      return NextResponse.json({
        success: true,
        message: "No hay socias que cumplan ambas condiciones (8 días + 3 pagos fallidos)",
        processed: 0,
      })
    }

    console.log(`[SEPA CRON] ${eligibleReservations.length} reserva(s) cumplen ambas condiciones (8 días + 3 pagos fallidos)`)

    const results = []

    for (const reservation of eligibleReservations) {
      try {
        const profile = reservation.profiles
        const bag = reservation.bags
        
        if (!profile || !bag) {
          console.warn(`[SEPA CRON] Reserva ${reservation.id}: datos incompletos`)
          continue
        }

        const customerName =
          profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Cliente"
        const bagName = `${bag.brand} ${bag.name}`.trim()
        const endDate = new Date(reservation.end_date)
        const endDateFormatted = endDate.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })

        console.log(`[SEPA CRON] Enviando aviso SEPA a ${profile.email} para reserva ${reservation.id}`)

        // Enviar email
        const emailResult = await sendSepaPreExecutionEmail({
          to: profile.email,
          customerName,
          bagName,
          rentalEndDate: endDateFormatted,
          amountDue: bag.retail_price || reservation.total_amount || 500, // Valor real del bolso; fallback al precio de alquiler o 500€
          reservationId: reservation.id,
        })

        if (emailResult.success) {
          // Guardar auditoría en DB
          const { error: updateError } = await supabaseAdmin
            .from("reservations")
            .update({
              sepa_pre_notice_sent_at: new Date().toISOString(),
              status: "overdue", // Cambiar a overdue si estaba en active
            })
            .eq("id", reservation.id)

          if (updateError) {
            console.error(`[SEPA CRON] Error guardando auditoría para reserva ${reservation.id}:`, updateError)
          } else {
            console.log(`[SEPA CRON] ✅ Aviso enviado y registrado para reserva ${reservation.id}`)
          }

          results.push({
            reservationId: reservation.id,
            email: profile.email,
            success: true,
            emailId: emailResult.emailId,
          })
        } else {
          console.error(`[SEPA CRON] Error enviando email para reserva ${reservation.id}:`, emailResult.error)
          results.push({
            reservationId: reservation.id,
            email: profile.email,
            success: false,
            error: emailResult.error,
          })
        }
      } catch (error) {
        console.error(`[SEPA CRON] Error procesando reserva ${reservation.id}:`, error)
        results.push({
          reservationId: reservation.id,
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    console.log(`[SEPA CRON] Completado: ${successCount} exitosos, ${failCount} fallidos`)

    return NextResponse.json({
      success: true,
      message: "Verificación completada",
      processed: overdueReservations.length,
      successful: successCount,
      failed: failCount,
      results,
    })
  } catch (error) {
    console.error("[SEPA CRON] Error crítico:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
