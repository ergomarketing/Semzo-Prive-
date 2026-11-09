/**
 * Correos de la renovacion automatica del pase semanal (Modo Colecciona, socias Petite):
 * aviso previo al cobro, cobro realizado, cobro fallido y cobro abandonado.
 * Cada envio queda en email_logs. Devuelven true si Resend acepto el correo.
 */
import { Resend } from "resend"
import { logEmail } from "@/lib/email-logger"
import { getResendApiKey } from "@/lib/resend-api-key"

const FROM = "Semzo Privé <hola@semzoprive.com>"
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"

type EmailKind = "notice" | "success" | "failed" | "gave_up"

interface Base {
  to: string
  name: string
  bagName: string
  reservationId: string
}

function layout(title: string, paragraphs: string[], cta?: { label: string; url: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 18px 0;">${p}</p>`).join("")
  const button = cta
    ? `<p style="margin:24px 0 0 0;text-align:center;"><a href="${cta.url}" style="display:inline-block;background:#1a1a4b;color:#ffffff;text-decoration:none;font-size:15px;padding:12px 26px;border-radius:6px;">${cta.label}</a></p>`
    : ""
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f9f8f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
  <tr><td align="center" style="padding:22px 20px 6px 20px;"><img src="${SITE}/images/logo-semzo-prive.png" alt="SEMZO PRIVÉ" width="200" style="display:block;height:auto;max-width:200px;border:0;" /></td></tr>
  <tr><td align="center" style="padding:24px 30px 6px 30px;"><h1 style="margin:0;font-family:Georgia,'Playfair Display',serif;font-weight:400;font-size:26px;line-height:1.3;color:#1a1a4b;">${title}</h1></td></tr>
  <tr><td align="center" style="padding:10px 0 18px 0;"><div style="width:40px;height:2px;background-color:#c9a96e;margin:0 auto;"></div></td></tr>
  <tr><td style="padding:0 30px 30px 30px;color:#1a1a4b;font-size:16px;line-height:1.7;">${body}${button}</td></tr>
  <tr><td style="background-color:#fff0f3;padding:20px 30px;text-align:center;color:#3a3a5c;font-size:13px;line-height:1.6;">¿Dudas? Escríbenos a <a href="mailto:info@semzoprive.com" style="color:#1a1a4b;">info@semzoprive.com</a>.</td></tr>
</table></body></html>`
}

async function send(kind: EmailKind, base: Base, subject: string, html: string, extra: Record<string, unknown>) {
  const key = getResendApiKey()
  const type = `colecciona_renewal_${kind}`
  const metadata = { reservationId: base.reservationId, bag: base.bagName, ...extra }
  if (!key) {
    await logEmail({ recipientEmail: base.to, recipientName: base.name, subject, emailType: type, status: "failed", errorMessage: "Sin clave de Resend", metadata })
    return false
  }
  try {
    const { data, error } = await new Resend(key).emails.send({ from: FROM, to: base.to, subject, html })
    if (error) throw new Error(String((error as { message?: string }).message || error))
    await logEmail({ recipientEmail: base.to, recipientName: base.name, subject, emailType: type, status: "sent", resendId: data?.id ?? null, metadata })
    return true
  } catch (err) {
    await logEmail({ recipientEmail: base.to, recipientName: base.name, subject, emailType: type, status: "failed", errorMessage: err instanceof Error ? err.message : String(err), metadata })
    return false
  }
}

const eur = (cents: number) => {
  const v = cents / 100
  return `${Number.isInteger(v) ? v : v.toFixed(2).replace(".", ",")} €`
}

/** Aviso previo: el dia X se cobra otra semana. */
export function sendRenewalNotice(p: Base & { amountCents: number; chargeDate: string; renewalsDone: number; maxRenewals: number }) {
  const html = layout(
    `Tu pase se renueva el ${p.chargeDate}`,
    [
      `Hola ${p.name},`,
      `El <strong>${p.chargeDate}</strong> termina tu pase semanal de <strong>${p.bagName}</strong>. Como lo tienes en Modo Colecciona, lo renovaremos automáticamente: cobraremos <strong>${eur(p.amountCents)}</strong> en tu tarjeta guardada y podrás quedártelo una semana más.`,
      `Ese importe <strong>suma crédito Colecciona</strong> para cuando decidas hacerlo tuyo.`,
      `Si prefieres comprarlo ya, devolverlo o dejar de renovar, hazlo antes de esa fecha desde tu panel. Esta sería la renovación ${p.renewalsDone + 1} de un máximo de ${p.maxRenewals} seguidas.`,
    ],
    { label: "Ir a mi panel", url: `${SITE}/dashboard` },
  )
  return send("notice", p, `Tu pase de ${p.bagName} se renueva el ${p.chargeDate} (${eur(p.amountCents)})`, html, { amountCents: p.amountCents })
}

/** Cobro realizado. */
export function sendRenewalSuccess(p: Base & { amountCents: number; newEndDate: string; accumulated: number | null }) {
  const html = layout(
    "Pase renovado",
    [
      `Hola ${p.name},`,
      `Hemos cobrado <strong>${eur(p.amountCents)}</strong> y tu pase de <strong>${p.bagName}</strong> queda renovado hasta el <strong>${p.newEndDate}</strong>.`,
      p.accumulated != null ? `Tu crédito Colecciona acumulado es ahora de <strong>${eur(Math.round(p.accumulated * 100))}</strong>.` : "",
      `Cuando quieras hacerlo tuyo, puedes completar la compra desde tu panel.`,
    ].filter(Boolean),
    { label: "Ir a mi panel", url: `${SITE}/dashboard` },
  )
  return send("success", p, `Pase renovado: ${p.bagName} hasta el ${p.newEndDate}`, html, { amountCents: p.amountCents })
}

/** El cobro no pasó: se reintenta mañana. */
export function sendRenewalFailed(p: Base & { amountCents: number; attemptsLeft: number }) {
  const html = layout(
    "No hemos podido renovar tu pase",
    [
      `Hola ${p.name},`,
      `Intentamos cobrar <strong>${eur(p.amountCents)}</strong> por la renovación de tu pase de <strong>${p.bagName}</strong>, pero tu banco no lo ha aceptado.`,
      `Lo volveremos a intentar mañana (te quedan ${p.attemptsLeft} intento${p.attemptsLeft === 1 ? "" : "s"}). Si tu tarjeta ha caducado o tiene un límite, actualízala en tu panel, en «Plan y pagos».`,
    ],
    { label: "Actualizar mi tarjeta", url: `${SITE}/dashboard/membresia` },
  )
  return send("failed", p, `No hemos podido renovar tu pase de ${p.bagName}`, html, { amountCents: p.amountCents })
}

/** Tras los reintentos: hay que devolver o comprar. */
export function sendRenewalGaveUp(p: Base & { amountCents: number }) {
  const html = layout(
    "Tu pase no se ha podido renovar",
    [
      `Hola ${p.name},`,
      `No hemos conseguido cobrar la renovación de <strong>${eur(p.amountCents)}</strong> de tu pase de <strong>${p.bagName}</strong>, así que dejamos de intentarlo.`,
      `Puedes <strong>completar la compra</strong> del bolso desde tu panel (tu crédito Colecciona sigue contando) o <strong>devolverlo</strong>. Si necesitas ayuda, escríbenos y lo resolvemos contigo.`,
    ],
    { label: "Ir a mi panel", url: `${SITE}/dashboard` },
  )
  return send("gave_up", p, `Tu pase de ${p.bagName} no se ha podido renovar`, html, { amountCents: p.amountCents })
}
