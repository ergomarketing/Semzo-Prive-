/**
 * Templates de email elegantes para flujos de membresía:
 * - Dunning (pago fallido en renovación)
 * - Recordatorio de devolución de bolso (2 días antes)
 *
 * Paleta: fondo crema #F8F5F0 | indigo oscuro #1B1B3A | dorado #B8967A
 * Remitente: hola@semzoprive.com | Tono: amable, cálido, sin presión
 */

const BASE_STYLES = `
  body { margin:0; padding:0; background:#F8F5F0; font-family: Georgia, 'Times New Roman', serif; }
  .wrapper { background:#F8F5F0; padding:40px 20px; }
  .card { max-width:580px; margin:0 auto; background:#ffffff; border-radius:4px; overflow:hidden; box-shadow:0 2px 12px rgba(27,27,58,0.08); }
  .header { background:#1B1B3A; padding:36px 40px; text-align:center; }
  .header .brand { color:#B8967A; font-size:11px; letter-spacing:4px; text-transform:uppercase; margin:0 0 6px 0; font-family:Arial,sans-serif; }
  .header h1 { color:#ffffff; font-size:22px; font-weight:normal; margin:0; letter-spacing:1px; }
  .body { padding:40px; color:#1B1B3A; }
  .body p { font-size:16px; line-height:1.7; margin:0 0 18px 0; color:#3a3a5c; }
  .body .greeting { font-size:20px; color:#1B1B3A; margin-bottom:24px; }
  .divider { width:40px; height:1px; background:#B8967A; margin:28px auto; }
  .cta-wrap { text-align:center; margin:32px 0; }
  .cta { display:inline-block; background:#1B1B3A; color:#ffffff !important; text-decoration:none; padding:14px 36px; font-family:Arial,sans-serif; font-size:14px; letter-spacing:2px; text-transform:uppercase; border-radius:2px; }
  .cta:hover { background:#2d2d5a; }
  .note { background:#F8F5F0; border-left:3px solid #B8967A; padding:16px 20px; margin:28px 0; font-size:14px; color:#5a5a7a; font-family:Arial,sans-serif; line-height:1.6; }
  .footer { background:#1B1B3A; padding:24px 40px; text-align:center; }
  .footer p { color:#8888aa; font-size:11px; font-family:Arial,sans-serif; letter-spacing:1px; margin:4px 0; text-transform:uppercase; }
  .footer a { color:#B8967A; text-decoration:none; }
`

// ─────────────────────────────────────────────
// FLUJO A: PAGO FALLIDO
// ─────────────────────────────────────────────

/** E1 — Inmediato tras fallo de pago */
export function generateDunningE1HTML(data: {
  userName: string
  membershipType: string
  bagName?: string
  updatePaymentUrl: string
}): string {
  const planLabel = capitalize(data.membershipType)
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Recordatorio de pago — Semzo Privé</title><style>${BASE_STYLES}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header">
      <p class="brand">Semzo Privé</p>
      <h1>Un pequeño recordatorio</h1>
    </div>
    <div class="body">
      <p class="greeting">Hola, ${data.userName}</p>
      <p>Hemos intentado procesar la renovación de tu membresía <strong>${planLabel}</strong> y parece que ha habido un pequeño contratiempo con el método de pago.</p>
      <p>No te preocupes, estas cosas pasan. Puedes actualizarlo en cualquier momento desde tu área de socia y tu membresía continuará sin interrupciones.</p>
      ${data.bagName ? `<div class="note">Recuerda que actualmente tienes contigo el bolso <strong>${data.bagName}</strong>. Estará contigo sin cambios mientras regularizas el pago.</div>` : ""}
      <div class="divider"></div>
      <div class="cta-wrap">
        <a href="${data.updatePaymentUrl}" class="cta">Actualizar método de pago</a>
      </div>
      <p style="text-align:center;font-size:13px;color:#8888aa;font-family:Arial,sans-serif;">Si ya lo has actualizado o necesitas ayuda, escríbenos a <a href="mailto:hola@semzoprive.com" style="color:#B8967A;">hola@semzoprive.com</a> y te atendemos enseguida.</p>
    </div>
    <div class="footer">
      <p>Semzo Privé · Marbella, España</p>
      <p><a href="mailto:hola@semzoprive.com">hola@semzoprive.com</a></p>
    </div>
  </div></div></body></html>`
}

/** E2 — +3 días, pago aún pendiente */
export function generateDunningE2HTML(data: {
  userName: string
  membershipType: string
  bagName?: string
  updatePaymentUrl: string
}): string {
  const planLabel = capitalize(data.membershipType)
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Tu membresía necesita atención — Semzo Privé</title><style>${BASE_STYLES}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header">
      <p class="brand">Semzo Privé</p>
      <h1>¿Actualizamos tu método de pago?</h1>
    </div>
    <div class="body">
      <p class="greeting">Hola de nuevo, ${data.userName}</p>
      <p>Nos permitimos escribirte porque tu membresía <strong>${planLabel}</strong> sigue pendiente de pago. Queremos asegurarnos de que puedas seguir disfrutando de Semzo Privé sin ninguna interrupción.</p>
      <p>Actualizar tu método de pago es muy sencillo y solo te llevará un momento.</p>
      ${data.bagName ? `<div class="note">Tienes contigo el bolso <strong>${data.bagName}</strong>. Estará contigo mientras puedas regularizar el pago.</div>` : ""}
      <div class="divider"></div>
      <div class="cta-wrap">
        <a href="${data.updatePaymentUrl}" class="cta">Actualizar método de pago</a>
      </div>
      <p style="text-align:center;font-size:13px;color:#8888aa;font-family:Arial,sans-serif;">Si prefieres hablar con nosotras, escríbenos a <a href="mailto:hola@semzoprive.com" style="color:#B8967A;">hola@semzoprive.com</a>. Estamos aquí para ayudarte.</p>
    </div>
    <div class="footer">
      <p>Semzo Privé · Marbella, España</p>
      <p><a href="mailto:hola@semzoprive.com">hola@semzoprive.com</a></p>
    </div>
  </div></div></body></html>`
}

/** E3 — +7 días, recordatorio final amable */
export function generateDunningE3HTML(data: {
  userName: string
  membershipType: string
  bagName?: string
  updatePaymentUrl: string
}): string {
  const planLabel = capitalize(data.membershipType)
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Seguimos aquí para ayudarte — Semzo Privé</title><style>${BASE_STYLES}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header">
      <p class="brand">Semzo Privé</p>
      <h1>Seguimos aquí para ayudarte</h1>
    </div>
    <div class="body">
      <p class="greeting">Hola, ${data.userName}</p>
      <p>Nos gustaría que tu membresía <strong>${planLabel}</strong> continuara con nosotras. El pago de tu renovación sigue pendiente y queremos encontrar la mejor solución para ti.</p>
      <p>Si en este momento no es el momento adecuado o prefieres hacer una pausa, cuéntanoslo: estamos aquí para escucharte y ayudarte a gestionar tu membresía de la manera que mejor te venga.</p>
      ${data.bagName ? `<div class="note">Si necesitas devolver el bolso <strong>${data.bagName}</strong>, escríbenos y lo organizamos juntas sin ningún problema.</div>` : ""}
      <div class="divider"></div>
      <div class="cta-wrap">
        <a href="${data.updatePaymentUrl}" class="cta">Gestionar mi membresía</a>
      </div>
      <p style="text-align:center;font-size:13px;color:#8888aa;font-family:Arial,sans-serif;">Contáctanos en <a href="mailto:hola@semzoprive.com" style="color:#B8967A;">hola@semzoprive.com</a> — con cariño y sin prisa.</p>
    </div>
    <div class="footer">
      <p>Semzo Privé · Marbella, España</p>
      <p><a href="mailto:hola@semzoprive.com">hola@semzoprive.com</a></p>
    </div>
  </div></div></body></html>`
}

/** Admin: alerta de pago fallido con bolso en posesión */
export function generateDunningAdminHTML(data: {
  userName: string
  userEmail: string
  membershipType: string
  bagName?: string
  failedAt: string
  dunningStep: number
}): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Pago fallido — ${data.userName}</title>
  <style>body{font-family:Arial,sans-serif;background:#f5f5f5;padding:20px}
  .card{max-width:560px;margin:0 auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
  .hdr{background:#1B1B3A;color:#fff;padding:20px 28px}.hdr h2{margin:0;font-size:18px}
  .body{padding:28px}.field{margin-bottom:12px;padding:12px 16px;background:#f8f5f0;border-radius:4px;font-size:14px}
  .field strong{color:#1B1B3A}.badge{display:inline-block;background:#e74c3c;color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:bold}</style>
  </head><body><div class="card">
    <div class="hdr"><h2>Alerta pago fallido — Paso ${data.dunningStep}</h2></div>
    <div class="body">
      <div class="field"><strong>Socia:</strong> ${data.userName}</div>
      <div class="field"><strong>Email:</strong> ${data.userEmail}</div>
      <div class="field"><strong>Membresía:</strong> ${capitalize(data.membershipType)}</div>
      ${data.bagName ? `<div class="field"><strong>Bolso en posesión:</strong> ${data.bagName} <span class="badge">Con la socia</span></div>` : ""}
      <div class="field"><strong>Fallo detectado:</strong> ${data.failedAt}</div>
      <div class="field"><strong>Email enviado a socia:</strong> Paso ${data.dunningStep} de 3</div>
    </div>
  </div></body></html>`
}

// ─────────────────────────────────────────────
// FLUJO B: RECORDATORIO DE DEVOLUCIÓN
// ─────────────────────────────────────────────

/** Recordatorio amable: devolución en 2 días */
export function generateReturnReminderHTML(data: {
  userName: string
  bagName: string
  bagBrand: string
  returnByDate: string
  membershipType: string
  dashboardUrl: string
}): string {
  const isPetite = data.membershipType === "petite"
  const subtitle = isPetite
    ? "Tu semana con este bolso está llegando a su fin"
    : "Pronto toca despedirse de este bolso"
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Recordatorio de devolución — Semzo Privé</title><style>${BASE_STYLES}</style></head>
  <body><div class="wrapper"><div class="card">
    <div class="header">
      <p class="brand">Semzo Privé</p>
      <h1>${subtitle}</h1>
    </div>
    <div class="body">
      <p class="greeting">Hola, ${data.userName}</p>
      <p>Queremos recordarte con cariño que el periodo de tu bolso <strong>${data.bagBrand} ${data.bagName}</strong> finaliza el próximo <strong>${data.returnByDate}</strong>.</p>
      <p>Cuando llegue el momento, simplemente coordina la devolución desde tu área de socia y nosotras nos encargamos de todo el proceso de recogida.</p>
      <div class="note">
        Fecha de devolución: <strong>${data.returnByDate}</strong><br>
        ${isPetite ? "El periodo de 7 días se cuenta desde que recibiste el bolso." : "Recuerda preparar el bolso con su funda y accesorios originales."}
      </div>
      <div class="divider"></div>
      <div class="cta-wrap">
        <a href="${data.dashboardUrl}" class="cta">Ir a mi área de socia</a>
      </div>
      <p style="text-align:center;font-size:13px;color:#8888aa;font-family:Arial,sans-serif;">¿Tienes alguna duda? Escríbenos a <a href="mailto:hola@semzoprive.com" style="color:#B8967A;">hola@semzoprive.com</a> y te ayudamos.</p>
    </div>
    <div class="footer">
      <p>Semzo Privé · Marbella, España</p>
      <p><a href="mailto:hola@semzoprive.com">hola@semzoprive.com</a></p>
    </div>
  </div></div></body></html>`
}

// ─────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────
function capitalize(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
