/**
 * CRON JOB: Verificar devoluciones vencidas (8 días)
 * 
 * Ejecuta diariamente para detectar reservas no devueltas 8 días después del fin de alquiler.
 * Envía email de aviso pre-ejecución SEPA obligatorio antes de cualquier cargo.
 * 
 * Frecuencia: Diaria (sugerido: 10:00 AM CET)
 * Endpoint: /api/cron/check-overdue-returns
 */

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { sendSepaPreExecutionEmail } from "@/lib/emails/send-sepa-pre-execution-email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
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

    // Fecha límite: hace 8 días
    const eightDaysAgo = new Date()
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8)
    eightDaysAgo.setHours(0, 0, 0, 0)

    // Buscar reservas:
    // - status = 'active' o 'overdue' (no devueltas)
    // - return_date <= hace 8 días
    // - sepa_pre_notice_sent_at = null (no se ha enviado aviso aún)
    const { data: overdueReservations, error: reservationsError } = await supabaseAdmin
      .from("reservations")
      .select(
        `
        id,
        user_id,
        bag_id,
        return_date,
        total_price,
        status,
        sepa_pre_notice_sent_at,
        profiles!inner(id, email, full_name, first_name, last_name),
        bags!inner(id, name, brand)
      `,
      )
      .in("status", ["active", "overdue"])
      .lte("return_date", eightDaysAgo.toISOString())
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
      console.log("[SEPA CRON] No hay devoluciones vencidas pendientes de aviso")
      return NextResponse.json({
        success: true,
        message: "No hay devoluciones vencidas",
        processed: 0,
      })
    }

    console.log(`[SEPA CRON] Encontradas ${overdueReservations.length} reservas vencidas sin aviso`)

    const results = []

    for (const reservation of overdueReservations) {
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
        const returnDate = new Date(reservation.return_date)
        const returnDateFormatted = returnDate.toLocaleDateString("es-ES", {
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
          rentalEndDate: returnDateFormatted,
          amountDue: reservation.total_price || 500, // Usar precio de reserva o valor default
          reservationId: reservation.id,
        })

        if (emailResult.success) {
          // Guardar auditoría en DB
          const { error: updateError } = await supabaseAdmin
            .from("reservations")
            .update({
              sepa_pre_notice_sent_at: new Date().toISOString(),
              email_provider: "resend",
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
