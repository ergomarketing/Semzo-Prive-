import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
const ADMIN_EMAIL = "soporte@semzoprive.com"

/**
 * Cron diario que vigila los pases Petite:
 *  - Envia recordatorio 2 dias antes del vencimiento
 *  - Envia aviso "atrasada" 1 dia despues del vencimiento (a la socia)
 *  - Notifica a admin cuando un pase vence sin devolucion
 *  - Sugiere cargo por retraso a partir de 3 dias de retraso
 *
 * Idempotente: usa columnas reminder_2d_sent_at / overdue_1d_sent_at
 * para no enviar dos veces el mismo email.
 */
export async function GET(request: Request) {
  // Validacion de secret de cron (Vercel Cron)
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const emailService = EmailServiceProduction.getInstance()
  const result = {
    reminders_2d_sent: 0,
    overdue_1d_sent: 0,
    admin_notifications: 0,
    errors: [] as string[],
  }

  try {
    // ============================================
    // 1) AVISO 2 DIAS ANTES (socia)
    // ============================================
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const { data: reminderCandidates } = await supabase
      .from("reservations")
      .select(`
        id, user_id, bag_id, pass_expires_at, reminder_2d_sent_at,
        profiles!reservations_user_id_fkey ( email, full_name, first_name, last_name ),
        bags!reservations_bag_id_fkey ( name, brand )
      `)
      .not("bag_pass_id", "is", null)
      .in("status", ["confirmed", "active"])
      .is("reminder_2d_sent_at", null)
      .gte("pass_expires_at", in2Days.toISOString())
      .lt("pass_expires_at", in3Days.toISOString())

    for (const r of reminderCandidates || []) {
      const profile: any = (r as any).profiles
      const bag: any = (r as any).bags
      if (!profile?.email) continue

      const userName =
        profile.full_name ||
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        "Cliente"
      const bagName = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu bolso"
      const expiryDate = new Date((r as any).pass_expires_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
      })

      try {
        await emailService.sendWithResend({
          to: profile.email,
          subject: `Tu semana con ${bagName} termina en 2 dias`,
          html: renderReminderHtml({ userName, bagName, expiryDate, when: "2_days_before" }),
        })
        await supabase
          .from("reservations")
          .update({ reminder_2d_sent_at: now.toISOString() })
          .eq("id", (r as any).id)
        result.reminders_2d_sent++
      } catch (err: any) {
        result.errors.push(`reminder_2d ${r.id}: ${err.message}`)
      }
    }

    // ============================================
    // 2) AVISO 1 DIA DESPUES DEL VENCIMIENTO (socia)
    // ============================================
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

    const { data: overdueCandidates } = await supabase
      .from("reservations")
      .select(`
        id, user_id, bag_id, pass_expires_at, overdue_1d_sent_at,
        profiles!reservations_user_id_fkey ( email, full_name, first_name, last_name ),
        bags!reservations_bag_id_fkey ( name, brand )
      `)
      .not("bag_pass_id", "is", null)
      .in("status", ["confirmed", "active"])
      .is("overdue_1d_sent_at", null)
      .lt("pass_expires_at", yesterday.toISOString())
      .gte("pass_expires_at", twoDaysAgo.toISOString())

    for (const r of overdueCandidates || []) {
      const profile: any = (r as any).profiles
      const bag: any = (r as any).bags
      if (!profile?.email) continue

      const userName =
        profile.full_name ||
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        "Cliente"
      const bagName = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu bolso"

      try {
        await emailService.sendWithResend({
          to: profile.email,
          subject: `Tu pase ha vencido — devuelve ${bagName} o renueva tu semana`,
          html: renderOverdueHtml({ userName, bagName }),
        })
        await supabase
          .from("reservations")
          .update({ overdue_1d_sent_at: now.toISOString() })
          .eq("id", (r as any).id)
        result.overdue_1d_sent++
      } catch (err: any) {
        result.errors.push(`overdue_1d ${r.id}: ${err.message}`)
      }
    }

    // ============================================
    // 3) NOTIFICACION ADMIN (pases vencidos sin devolucion)
    // ============================================
    const { data: adminCandidates } = await supabase
      .from("reservations")
      .select(`
        id, user_id, bag_id, pass_expires_at, overdue_admin_notified_at,
        profiles!reservations_user_id_fkey ( email, full_name ),
        bags!reservations_bag_id_fkey ( name, brand )
      `)
      .not("bag_pass_id", "is", null)
      .in("status", ["confirmed", "active"])
      .is("overdue_admin_notified_at", null)
      .lt("pass_expires_at", yesterday.toISOString())

    for (const r of adminCandidates || []) {
      const profile: any = (r as any).profiles
      const bag: any = (r as any).bags
      const daysOverdue = Math.floor(
        (now.getTime() - new Date((r as any).pass_expires_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
      const bagName = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "bolso"

      try {
        // 3a) Email a admin
        await emailService.sendWithResend({
          to: ADMIN_EMAIL,
          subject: `[Petite] Pase vencido sin devolucion — ${profile?.full_name || profile?.email}`,
          html: renderAdminAlertHtml({
            userName: profile?.full_name || "Sin nombre",
            userEmail: profile?.email || "Sin email",
            bagName,
            daysOverdue,
            reservationId: (r as any).id,
            suggestCharge: daysOverdue >= 3,
          }),
        })

        // 3b) admin_notifications (centro de alertas en panel)
        await supabase.from("admin_notifications").insert({
          type: "petite_pass_overdue",
          priority: daysOverdue >= 3 ? "high" : "normal",
          title: `Pase Petite vencido (${daysOverdue}d) — ${profile?.full_name || profile?.email}`,
          message: daysOverdue >= 3
            ? `Considera aplicar cargo por retraso. ${bagName} sigue sin devolver.`
            : `${bagName} no devuelto. Contactar a la socia.`,
          metadata: {
            user_id: (r as any).user_id,
            user_email: profile?.email,
            user_name: profile?.full_name,
            reservation_id: (r as any).id,
            bag_id: (r as any).bag_id,
            bag_name: bagName,
            pass_expires_at: (r as any).pass_expires_at,
            days_overdue: daysOverdue,
            suggest_late_fee: daysOverdue >= 3,
          },
        })

        await supabase
          .from("reservations")
          .update({ overdue_admin_notified_at: now.toISOString() })
          .eq("id", (r as any).id)

        result.admin_notifications++
      } catch (err: any) {
        result.errors.push(`admin_notif ${r.id}: ${err.message}`)
      }
    }

    return NextResponse.json({ success: true, ...result, run_at: now.toISOString() })
  } catch (error: any) {
    console.error("[check-petite-passes] Error general:", error)
    return NextResponse.json(
      { error: error.message, partial_result: result },
      { status: 500 },
    )
  }
}

// ============================================
// PLANTILLAS HTML (paleta Semzo)
// ============================================
const COLORS = {
  indigo: "#1a1a4b",
  cream: "#f8f6f2",
  gold: "#b8a06a",
  rose: "#e8d5c4",
}

function wrapper(inner: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fff;">
      <div style="background: ${COLORS.indigo}; padding: 24px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 22px; letter-spacing: 2px;">SEMZO PRIVE</h1>
      </div>
      <div style="padding: 32px;">${inner}</div>
      <div style="background: ${COLORS.cream}; padding: 16px; text-align: center; font-size: 12px; color: #888;">
        <p style="margin: 0;">Semzo Prive · <a href="mailto:soporte@semzoprive.com" style="color: ${COLORS.indigo};">soporte@semzoprive.com</a></p>
      </div>
    </div>`
}

function renderReminderHtml(opts: {
  userName: string
  bagName: string
  expiryDate: string
  when: "2_days_before"
}) {
  return wrapper(`
    <h2 style="color: ${COLORS.indigo}; margin-top: 0;">Hola ${opts.userName},</h2>
    <p style="color: #444; line-height: 1.6;">
      Tu semana con <strong>${opts.bagName}</strong> termina el <strong>${opts.expiryDate}</strong>.
    </p>
    <p style="color: #444; line-height: 1.6;">
      Tienes dos opciones:
    </p>
    <div style="background: ${COLORS.cream}; padding: 20px; border-left: 3px solid ${COLORS.gold}; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; color: ${COLORS.indigo};"><strong>Devolverlo</strong> y elegir otro de la coleccion.</p>
      <p style="margin: 0; color: ${COLORS.indigo};"><strong>Comprar otro pase</strong> y conservar este bolso una semana mas.</p>
    </div>
    <div style="margin: 32px 0; text-align: center;">
      <a href="${SITE_URL}/dashboard" style="background: ${COLORS.indigo}; color: #fff; padding: 14px 32px; text-decoration: none; letter-spacing: 1px; font-size: 13px; display: inline-block;">
        IR A MI CUENTA
      </a>
    </div>
  `)
}

function renderOverdueHtml(opts: { userName: string; bagName: string }) {
  return wrapper(`
    <h2 style="color: ${COLORS.indigo}; margin-top: 0;">Hola ${opts.userName},</h2>
    <p style="color: #444; line-height: 1.6;">
      Tu pase ha vencido y <strong>${opts.bagName}</strong> sigue contigo.
    </p>
    <p style="color: #444; line-height: 1.6;">
      Para evitar cargos por retraso, devuelve el bolso o renueva tu semana cuanto antes.
    </p>
    <div style="margin: 32px 0; text-align: center;">
      <a href="${SITE_URL}/dashboard/devoluciones" style="background: ${COLORS.indigo}; color: #fff; padding: 14px 32px; text-decoration: none; letter-spacing: 1px; font-size: 13px; display: inline-block; margin: 4px;">
        DEVOLVER BOLSO
      </a>
      <a href="${SITE_URL}/membresia/petite/comprar-pase" style="background: ${COLORS.gold}; color: #fff; padding: 14px 32px; text-decoration: none; letter-spacing: 1px; font-size: 13px; display: inline-block; margin: 4px;">
        COMPRAR NUEVO PASE
      </a>
    </div>
  `)
}

function renderAdminAlertHtml(opts: {
  userName: string
  userEmail: string
  bagName: string
  daysOverdue: number
  reservationId: string
  suggestCharge: boolean
}) {
  return wrapper(`
    <h2 style="color: ${COLORS.indigo}; margin-top: 0;">Pase Petite vencido</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px 0; color: #666;">Socia:</td><td style="padding: 8px 0; color: ${COLORS.indigo};"><strong>${opts.userName}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;">${opts.userEmail}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Bolso:</td><td style="padding: 8px 0;">${opts.bagName}</td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Dias de retraso:</td><td style="padding: 8px 0; color: ${opts.daysOverdue >= 3 ? "#c00" : COLORS.indigo};"><strong>${opts.daysOverdue}</strong></td></tr>
      <tr><td style="padding: 8px 0; color: #666;">Reserva:</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px;">${opts.reservationId}</td></tr>
    </table>
    ${
      opts.suggestCharge
        ? `<div style="background: #fff5f5; border-left: 3px solid #c00; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #c00;"><strong>Sugerencia:</strong> aplicar cargo por retraso (${opts.daysOverdue} dias).</p>
          </div>`
        : ""
    }
    <div style="margin: 32px 0; text-align: center;">
      <a href="${SITE_URL}/admin/logistics" style="background: ${COLORS.indigo}; color: #fff; padding: 14px 32px; text-decoration: none; letter-spacing: 1px; font-size: 13px; display: inline-block;">
        ABRIR PANEL ADMIN
      </a>
    </div>
  `)
}
