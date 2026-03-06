const RESEND_API = "https://api.resend.com/emails"
const FROM = "Semzo Privé <noreply@semzoprive.com>"
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "hola@semzoprive.com"

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.EMAIL_API_KEY
  if (!key) return

  await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  })
}

export const adminNotifications = {
  async notifyNewNewsletterSubscription({
    email,
    name,
    preferences,
  }: {
    email: string
    name?: string
    preferences?: Record<string, unknown>
  }) {
    const source = (preferences?.source as string) || "newsletter"
    const isListaPrivada = source === "lista-privada-marbella"

    // Email al admin
    await sendEmail(
      ADMIN_EMAIL,
      isListaPrivada
        ? `Nueva solicitud Lista Privada Marbella — ${name || email}`
        : `Nueva suscripción newsletter — ${name || email}`,
      `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a4b">
          <h2 style="border-bottom:1px solid #e5e7eb;padding-bottom:12px">
            ${isListaPrivada ? "Nueva solicitud — Lista Privada Marbella" : "Nueva suscripción — Newsletter"}
          </h2>
          <p><strong>Nombre:</strong> ${name || "No indicado"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Fuente:</strong> ${source}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</p>
        </div>
      `
    )

    // Confirmación al usuario
    if (isListaPrivada) {
      await sendEmail(
        email,
        "Ya estás en la Lista Privada — Semzo Privé Marbella",
        `
          <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a4b">
            <h2>Hola${name ? `, ${name}` : ""},</h2>
            <p>Has quedado registrada en nuestra <strong>Lista Privada de Marbella</strong>.</p>
            <p>Te avisaremos con acceso prioritario cuando abramos plazas, antes que nadie.</p>
            <p style="margin-top:32px;font-size:13px;color:#6b7280">
              Semzo Privé · Marbella<br>
              <a href="https://semzoprive.com" style="color:#1a1a4b">semzoprive.com</a>
            </p>
          </div>
        `
      )
    } else {
      await sendEmail(
        email,
        "Bienvenida a Semzo Privé",
        `
          <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a4b">
            <h2>Hola${name ? `, ${name}` : ""},</h2>
            <p>Gracias por suscribirte. Recibirás novedades exclusivas de nuestra colección.</p>
            <p style="margin-top:32px;font-size:13px;color:#6b7280">
              Semzo Privé · <a href="https://semzoprive.com" style="color:#1a1a4b">semzoprive.com</a>
            </p>
          </div>
        `
      )
    }
  },
}
