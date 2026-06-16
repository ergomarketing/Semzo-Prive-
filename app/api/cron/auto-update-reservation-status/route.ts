import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mailbox@semzoprive.com"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
const emailService = new EmailServiceProduction()

export async function GET() {
  try {
    const now = new Date()

    // IMPORTANTE: excluimos reservas admin (is_admin_rent = true) de la
    // auto-activacion y auto-completado. Esas reservas solo las gestiona
    // el admin manualmente desde el panel de inventario (marcar alquilado /
    // marcar disponible). De lo contrario, el bolso "bloqueado manualmente"
    // volveria a disponible cuando caduque la fecha por defecto.
    const { data: toActivate } = await supabase
      .from("reservations")
      .select("*")
      .eq("status", "confirmed")
      .or("is_admin_rent.is.null,is_admin_rent.eq.false")
      .lt("start_date", now.toISOString())

    if (toActivate && toActivate.length > 0) {
      await supabase
        .from("reservations")
        .update({ status: "active", updated_at: now.toISOString() })
        .in(
          "id",
          toActivate.map((r) => r.id),
        )

      for (const reservation of toActivate) {
        await supabase.from("audit_log").insert({
          user_id: "system",
          action: "reservation_auto_activated",
          entity_type: "reservation",
          entity_id: reservation.id,
          old_data: { status: "confirmed" },
          new_data: { status: "active" },
          created_at: now.toISOString(),
        })
      }
    }

    // IMPORTANTE: al vencer end_date la reserva pasa a 'overdue', NO a 'completed'.
    // El bolso NO se libera aqui. La reserva solo se cierra (completed) y el bolso
    // se libera cuando logistica registra la devolucion fisica (returns.status
    // received/completed). Asi se respeta la regla "no reservar hasta devolver".
    const { data: toOverdue } = await supabase
      .from("reservations")
      .select(`
        *,
        profiles!inner(id, email, full_name, first_name, last_name),
        bags!inner(id, name, brand)
      `)
      .eq("status", "active")
      .or("is_admin_rent.is.null,is_admin_rent.eq.false")
      .lt("end_date", now.toISOString())

    if (toOverdue && toOverdue.length > 0) {
      await supabase
        .from("reservations")
        .update({ status: "overdue", updated_at: now.toISOString() })
        .in(
          "id",
          toOverdue.map((r) => r.id),
        )

      for (const reservation of toOverdue) {
        await supabase.from("audit_log").insert({
          user_id: "system",
          action: "reservation_auto_overdue",
          entity_type: "reservation",
          entity_id: reservation.id,
          old_data: { status: "active" },
          new_data: { status: "overdue" },
          created_at: now.toISOString(),
        })

        // Notificar a la socia
        const profile = reservation.profiles
        const bag = reservation.bags
        if (profile?.email) {
          const customerName = profile.full_name ||
            `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Socia"
          const bagName = `${bag?.brand || ""} ${bag?.name || ""}`.trim()
          const endDateFormatted = new Date(reservation.end_date).toLocaleDateString("es-ES", {
            day: "numeric", month: "long", year: "numeric"
          })

          await emailService.sendWithResend({
            to: profile.email,
            subject: `Recordatorio de devolución — ${bagName}`,
            html: `
              <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#fff;">
                <div style="background:#1a1a4b;padding:24px;text-align:center;">
                  <img src="${SITE_URL}/images/logo-semzo-prive.png" alt="SEMZO PRIVÉ" width="180" style="height:auto;" />
                </div>
                <div style="padding:32px 40px;">
                  <p style="color:#1a1a4b;font-size:16px;">Hola <strong>${customerName}</strong>,</p>
                  <p style="color:#333;font-size:15px;line-height:1.7;">
                    El periodo de alquiler de tu bolso <strong>${bagName}</strong> venció el <strong>${endDateFormatted}</strong>.
                  </p>
                  <p style="color:#333;font-size:15px;line-height:1.7;">
                    Por favor, organiza la devolución lo antes posible. Si ya lo has enviado, ignora este mensaje.
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${SITE_URL}/dashboard/reservas/${reservation.id}"
                       style="background:#1a1a4b;color:#c9a96e;text-decoration:none;padding:14px 32px;font-size:13px;letter-spacing:0.1em;display:inline-block;">
                      VER MI RESERVA
                    </a>
                  </div>
                  <p style="color:#888;font-size:13px;">Si tienes alguna duda, contáctanos en soporte@semzoprive.com</p>
                </div>
                <div style="background:#1a1a4b;padding:20px;text-align:center;">
                  <p style="color:#c9a96e;font-size:11px;letter-spacing:0.15em;margin:0;">SEMZO PRIVÉ · MARBELLA, ESPAÑA</p>
                  <p style="margin:8px 0 0;"><a href="${SITE_URL}/unsubscribe" style="color:#888;font-size:11px;">Darse de baja</a></p>
                </div>
              </div>`,
          }).catch((e) => console.error(`[overdue-cron] Error email socia ${profile.email}:`, e))

          // Notificar a admin
          await emailService.sendWithResend({
            to: ADMIN_EMAIL,
            subject: `[SEMZO Admin] Devolución vencida — ${customerName} · ${bagName}`,
            html: `
              <p><strong>Devolución vencida</strong></p>
              <p>Socia: ${customerName} (${profile.email})</p>
              <p>Bolso: ${bagName}</p>
              <p>Fecha límite: ${endDateFormatted}</p>
              <p>ID reserva: ${reservation.id}</p>
              <p><a href="${SITE_URL}/admin/reservations/${reservation.id}">Ver en admin</a></p>`,
          }).catch((e) => console.error(`[overdue-cron] Error email admin:`, e))
        }
      }
    }

    return NextResponse.json({
      success: true,
      activated: toActivate?.length || 0,
      overdue: toOverdue?.length || 0,
    })
  } catch (error) {
    console.error("Error auto-updating reservations:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
