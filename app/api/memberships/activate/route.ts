import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 9 del flujo de suscripcion: ACTIVAR MEMBRESIA
 *
 * Se llama DESPUES de save-mandate y solo activa si:
 *  - Identity esta verified / approved
 *  - profiles.sepa_payment_method_id esta seteado
 *  - Membresia existe en estado activable (pending_sepa, pending_verification,
 *    paid_pending_verification) o ya activa (idempotente)
 *
 * Al activar:
 *  - user_memberships.status = "active"  (FUENTE DE VERDAD)
 *  - profiles.membership_status = "active"  (sync para dashboard)
 *  - profiles.membership_type = <plan>  (sync para dashboard)
 *
 * NO valida campos de direccion de envio: eso se completa al reservar
 * (paso 10 → bag-detail), no aqui. No anadir validaciones de shipping_*.
 * ============================================================================
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // 1. Usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  // 2. Obtener membresia (FUENTE DE VERDAD)
  const { data: membership, error: membershipError } = await supabase
    .from("user_memberships")
    .select("id, user_id, membership_type, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Membresia no encontrada" }, { status: 400 })
  }

  // 3. Validar identidad verificada (FUENTE DE VERDAD: identity_verifications)
  // El perfil extendido (direccion, telefono, documento) se completa al reservar, no aqui.
  const { data: identityCheck } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!identityCheck || (identityCheck.status !== "approved" && identityCheck.status !== "verified")) {
    return NextResponse.json({ error: "Identidad no verificada" }, { status: 400 })
  }

  // 4. Validar SEPA guardado (FUENTE DE VERDAD: profiles.sepa_payment_method_id)
  const { data: sepaProfile } = await supabase
    .from("profiles")
    .select("sepa_payment_method_id")
    .eq("id", user.id)
    .single()

  if (!sepaProfile?.sepa_payment_method_id) {
    return NextResponse.json({ error: "Mandato SEPA no configurado" }, { status: 400 })
  }

  // 5. Si ya esta activa, devolver exito (idempotente)
  if (membership.status === "active") {
    return NextResponse.json({ success: true, membership_status: "active" })
  }

  // 6. Aceptar pending_sepa, pending_verification, paid_pending_verification como validos para activar
  const activatableStatuses = ["pending_sepa", "pending_verification", "paid_pending_verification"]
  if (!activatableStatuses.includes(membership.status)) {
    return NextResponse.json({ error: `Estado de membresia invalido: ${membership.status}` }, { status: 400 })
  }

  // 7. Activar membresia en user_memberships (FUENTE DE VERDAD)
  // can_make_reservations: true es OBLIGATORIO porque la columna tiene
  // DEFAULT false. Sin este flag el gate del endpoint /api/user/reservations
  // bloquea al usuario aunque la membresia este activa.
  const { error: updateError } = await supabase
    .from("user_memberships")
    .update({
      status: "active",
      can_make_reservations: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)

  if (updateError) {
    return NextResponse.json({ error: "Error activando membresia" }, { status: 500 })
  }

  // 8. Sincronizar profiles.membership_status para que el dashboard refleje estado correcto
  await supabase
    .from("profiles")
    .update({
      membership_status: "active",
      membership_type: membership.membership_type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  // 9. Email de confirmacion de membresia activa (best-effort, no bloquea la respuesta)
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, first_name")
      .eq("id", user.id)
      .single()

    const recipientEmail = profile?.email || user.email
    const firstName =
      profile?.first_name || profile?.full_name?.split(" ")?.[0] || "Cliente"

    if (recipientEmail) {
      const tierNames: Record<string, string> = {
        essentiel: "L'Essentiel",
        signature: "Signature",
        prive: "Privé",
      }
      const planLabel = tierNames[membership.membership_type] || membership.membership_type

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

      const subject = `Tu membresia ${planLabel} ya esta activa`
      const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:Georgia,'Times New Roman',serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
        <tr>
          <td style="background:#1a1d3a;padding:28px 32px;color:#ffffff;text-align:center;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:2px;">SEMZO PRIVÉ</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 24px;">
            <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;line-height:1.3;color:#1f2937;">
              Bienvenida a ${planLabel}, ${firstName}.
            </h1>
            <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#4b5563;">
              Tu membresia ya esta activa. Desde este momento puedes reservar bolsos de la coleccion ${planLabel}
              y disfrutar de la experiencia Semzo Prive.
            </p>
            <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#6b7280;">
              Hemos validado tu identidad y registrado tu mandato SEPA correctamente. No se efectuaran cargos en tu
              cuenta salvo en caso de incidencia, segun los terminos aceptados.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 0;">
              <tr><td style="border-radius:6px;background:#1a1d3a;">
                <a href="${siteUrl}/dashboard" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:14px;color:#ffffff;text-decoration:none;letter-spacing:1px;">
                  IR A MI ESPACIO
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 32px;">
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0 20px;" />
            <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">
              Si tienes cualquier duda, escribenos a
              <a href="mailto:hola@semzoprive.com" style="color:#1a1d3a;text-decoration:none;">hola@semzoprive.com</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()

      const text = `Bienvenida a ${planLabel}, ${firstName}.\n\nTu membresia Semzo Prive ya esta activa. Accede a tu espacio en ${siteUrl}/dashboard.\n\nSi tienes cualquier duda escribenos a hola@semzoprive.com.`

      await fetch(`${siteUrl}/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          html,
          text,
          type: "membership_activated",
          customerData: {
            user_id: user.id,
            membership_type: membership.membership_type,
          },
        }),
      }).catch((e) => console.error("[memberships/activate] email send failed:", e?.message))
    }
  } catch (emailErr: any) {
    console.error("[memberships/activate] email block error:", emailErr?.message)
  }

    return NextResponse.json({
      success: true,
      membership_status: "active",
    })
  } catch (err: any) {
    console.error("[memberships/activate] Error:", err?.message, err?.stack)
    return NextResponse.json(
      { error: err?.message || "Error inesperado activando membresia" },
      { status: 500 }
    )
  }
}
