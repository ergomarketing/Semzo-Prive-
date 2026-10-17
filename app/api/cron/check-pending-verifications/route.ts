import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { promoteStuckMemberships } from "@/lib/membership-safety-net"
import { fetchProfilesById } from "@/lib/profile-lookup"

// CRITICAL: No cache - cron job
export const dynamic = "force-dynamic"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mailbox@semzoprive.com"

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Cliente de servicio: un cron no tiene sesion y con la clave anonima RLS
    // devolvia 0 filas. membership_intents no tiene relacion con profiles, asi que
    // los perfiles se leen aparte (fetchProfilesById).
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Red de seguridad: promueve membresias atascadas que ya cumplen las 3 condiciones.
    // Va PRIMERO y aislada: es lo critico y no debe depender de que los recordatorios
    // de abajo funcionen (antes un error de consulta devolvia 500 y nunca llegaba aqui).
    let safetyNet = null
    try {
      safetyNet = await promoteStuckMemberships()
    } catch (safetyErr: any) {
      console.error("[v0] Safety net failed:", safetyErr?.message)
    }

    // Buscar membresías con pending_identity_verification hace más de 72h
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

    const { data: pendingIntents, error } = await supabase
      .from("membership_intents")
      .select("id, user_id, membership_type, created_at")
      .eq("status", "pending_identity_verification")
      .lt("created_at", seventyTwoHoursAgo)

    if (error) {
      console.error("Error fetching pending verifications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Found ${pendingIntents?.length || 0} users pending verification > 72h`)

    const pendingProfiles = await fetchProfilesById(supabase, (pendingIntents || []).map((i) => i.user_id))

    // Enviar recordatorio a cada usuario
    for (const intent of pendingIntents || []) {
      const profile = pendingProfiles[intent.user_id]

      if (!profile?.email) continue

      // Enviar email de recordatorio
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          subject: "Recordatorio: Completa tu Verificación - Semzo Privé",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a4b;">Completa tu Verificación de Identidad</h2>
              <p>Hola ${profile.full_name || ""},</p>
              <p>Hemos notado que aún no has completado tu verificación de identidad. Tu pago fue procesado exitosamente, pero necesitamos verificar tu identidad para activar tu acceso completo.</p>
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Importante:</strong> Si no completas la verificación en los próximos 4 días, tu acceso al catálogo será limitado.
                </p>
              </div>
              <div style="margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                   style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Completar Verificación Ahora
                </a>
              </div>
              <p style="color: #666; font-size: 12px;">
                La verificación solo toma 2-3 minutos. Si tienes problemas, contáctanos en ${ADMIN_EMAIL}
              </p>
            </div>
          `,
        }),
      })

      console.log(`[v0] Sent 72h reminder to user ${intent.user_id}`)
    }

    // Buscar membresías sin verificar hace más de 7 días → marcar como acceso limitado
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: expiredIntents, error: expiredError } = await supabase
      .from("membership_intents")
      .select("id, user_id")
      .eq("status", "pending_identity_verification")
      .lt("created_at", sevenDaysAgo)

    if (expiredError) {
      console.error("Error fetching expired verifications:", expiredError)
    } else {
      const expiredProfiles = await fetchProfilesById(supabase, (expiredIntents || []).map((i) => i.user_id))
      for (const intent of expiredIntents || []) {
        // Marcar como acceso limitado
        await supabase
          .from("membership_intents")
          .update({
            status: "limited_access",
            updated_at: new Date().toISOString(),
          })
          .eq("id", intent.id)

        const profile = expiredProfiles[intent.user_id]

        if (profile?.email) {
          // Enviar email de acceso limitado
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: profile.email,
              subject: "Acceso Limitado - Verifica tu Identidad - Semzo Privé",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #dc2626;">Tu Acceso ha sido Limitado</h2>
                  <p>Hola ${profile.full_name || ""},</p>
                  <p>Han pasado 7 días desde tu registro y aún no has completado la verificación de identidad. Por seguridad, hemos limitado tu acceso.</p>
                  <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p style="margin: 0; color: #991b1b;">
                      <strong>Acceso actual:</strong> Puedes ver el catálogo pero no realizar reservas ni checkout.
                    </p>
                  </div>
                  <p>Para recuperar tu acceso completo, simplemente completa la verificación de identidad:</p>
                  <div style="margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                       style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      Verificar Identidad
                    </a>
                  </div>
                  <p style="color: #666; font-size: 12px;">
                    Si tienes problemas, contáctanos en ${ADMIN_EMAIL}
                  </p>
                </div>
              `,
            }),
          })
        }

        console.log(`[v0] Marked user ${intent.user_id} as limited_access (7+ days without verification)`)
      }
    }

    return NextResponse.json({
      success: true,
      reminders_sent: pendingIntents?.length || 0,
      limited_access_applied: expiredIntents?.length || 0,
      safety_net: safetyNet,
    })
  } catch (error: any) {
    console.error("[v0] Error in check-pending-verifications cron:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
