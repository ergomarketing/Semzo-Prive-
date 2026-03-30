/**
 * CRON JOB: Enviar recordatorios de devolucion
 * 
 * Ejecuta diariamente para enviar recordatorios a usuarios con devoluciones proximas.
 * Envia recordatorio 3 dias antes y 1 dia antes de la fecha de devolucion.
 * 
 * Frecuencia: Diaria (sugerido: 9:00 AM CET)
 * Endpoint: /api/cron/send-return-reminders
 */

import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    // Verificar autorizacion del cron
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[RETURN REMINDER] Iniciando envio de recordatorios...")

    const emailService = EmailServiceProduction.getInstance()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fechas objetivo: 3 dias y 1 dia antes
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const oneDayFromNow = new Date(today)
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)

    // Buscar reservas activas con fecha de devolucion proxima
    const { data: reservations, error: reservationsError } = await supabaseAdmin
      .from("reservations")
      .select(`
        id,
        user_id,
        bag_id,
        return_date,
        end_date,
        status,
        return_reminder_sent_3d,
        return_reminder_sent_1d,
        profiles!inner(id, email, full_name, first_name, last_name),
        bags!inner(id, name, brand)
      `)
      .eq("status", "active")
      .or(`return_date.eq.${threeDaysFromNow.toISOString().split('T')[0]},return_date.eq.${oneDayFromNow.toISOString().split('T')[0]},end_date.eq.${threeDaysFromNow.toISOString().split('T')[0]},end_date.eq.${oneDayFromNow.toISOString().split('T')[0]}`)

    if (reservationsError) {
      console.error("[RETURN REMINDER] Error consultando reservas:", reservationsError)
      return NextResponse.json({
        success: false,
        error: reservationsError.message,
      }, { status: 500 })
    }

    if (!reservations || reservations.length === 0) {
      console.log("[RETURN REMINDER] No hay recordatorios pendientes")
      return NextResponse.json({
        success: true,
        message: "No hay recordatorios pendientes",
        processed: 0,
      })
    }

    console.log(`[RETURN REMINDER] Encontradas ${reservations.length} reservas para recordatorio`)

    const results = []

    for (const reservation of reservations) {
      try {
        const profile = reservation.profiles
        const bag = reservation.bags

        if (!profile || !bag) {
          console.warn(`[RETURN REMINDER] Reserva ${reservation.id}: datos incompletos`)
          continue
        }

        const returnDate = new Date(reservation.return_date || reservation.end_date)
        const daysRemaining = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Verificar si ya se envio el recordatorio correspondiente
        if (daysRemaining === 3 && reservation.return_reminder_sent_3d) {
          console.log(`[RETURN REMINDER] Reserva ${reservation.id}: recordatorio 3d ya enviado`)
          continue
        }
        if (daysRemaining === 1 && reservation.return_reminder_sent_1d) {
          console.log(`[RETURN REMINDER] Reserva ${reservation.id}: recordatorio 1d ya enviado`)
          continue
        }

        const customerName = profile.full_name || 
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || 
          "Cliente"
        const bagName = `${bag.brand} ${bag.name}`.trim()

        console.log(`[RETURN REMINDER] Enviando recordatorio ${daysRemaining}d a ${profile.email}`)

        // Enviar email de recordatorio
        const emailSent = await emailService.sendReturnReminderEmail({
          userEmail: profile.email,
          userName: customerName,
          bagName,
          returnDate: returnDate.toISOString(),
          daysRemaining,
        })

        if (emailSent) {
          // Actualizar registro de recordatorio enviado
          const updateField = daysRemaining === 3 
            ? { return_reminder_sent_3d: new Date().toISOString() }
            : { return_reminder_sent_1d: new Date().toISOString() }

          await supabaseAdmin
            .from("reservations")
            .update(updateField)
            .eq("id", reservation.id)

          console.log(`[RETURN REMINDER] Recordatorio enviado para reserva ${reservation.id}`)
          results.push({
            reservationId: reservation.id,
            email: profile.email,
            daysRemaining,
            success: true,
          })
        } else {
          results.push({
            reservationId: reservation.id,
            email: profile.email,
            success: false,
            error: "Error enviando email",
          })
        }
      } catch (error) {
        console.error(`[RETURN REMINDER] Error procesando reserva ${reservation.id}:`, error)
        results.push({
          reservationId: reservation.id,
          success: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    console.log(`[RETURN REMINDER] Completado: ${successCount} exitosos, ${failCount} fallidos`)

    return NextResponse.json({
      success: true,
      message: "Recordatorios enviados",
      processed: reservations.length,
      successful: successCount,
      failed: failCount,
      results,
    })
  } catch (error) {
    console.error("[RETURN REMINDER] Error critico:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }, { status: 500 })
  }
}
