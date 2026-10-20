/**
 * Familia "pagos y membresía" de correos de servicio (diseño de Erika, 2026-10-19): UN solo molde con el logo, el
 * titular, el cuerpo, el botón y el bloque editorial de firma; cada correo solo aporta su texto y su botón.
 * Así un cambio de diseño se hace en un único sitio.
 *
 * Correos de esta familia y sus variables:
 *   payment_failed_1/2/3  {{nombre}} {{tier}} {{url_actualizar_pago}}
 *   payment_receipt       {{nombre}} {{importe}} {{fecha_pago}} {{concepto}} {{metodo_pago}}
 *   refund                {{nombre}} {{importe}} {{concepto}}
 *   membership_renewed    {{nombre}} {{tier}} {{importe}} {{fecha_renovacion}}
 * Son correos de servicio: sin "Darse de baja".
 */

interface Parts {
  /** <title> y pie de la pestaña */
  title: string
  eyebrow: string
  /** Titular (admite <br />) */
  headingHtml: string
  /** Tamaño del titular en px (por defecto 28) */
  headingSize?: number
  /** Contenido del cuerpo (párrafos en el estilo serif de 17 px) */
  bodyHtml: string
  /** Bloques completos (tablas) entre el cuerpo y el botón: p. ej. el bloque rosa (opcional) */
  afterBodyHtml?: string
  /** Frase central en cursiva, antes del botón (opcional) */
  centralPhrase?: string
  ctaLabel: string
  ctaHref: string
  /** Nota pequeña bajo el botón (opcional) */
  ctaNote?: string
}

const P = (text: string) => `<p style="margin:0 0 20px 0;">${text}</p>`

/** Tabla de datos (etiqueta + valor) de los recibos. */
const dataTable = (rows: Array<[string, string]>) => `
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background-color:#faf8f8;border-radius:8px;margin-bottom:24px;">
                      <tr><td style="padding:20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
${rows
  .map(([label, value], i) => {
    const first = i === 0
    const last = i === rows.length - 1
    const pad = first ? "padding-bottom:8px;" : last ? "padding-top:8px;" : "padding:8px 0;"
    const border = first ? "" : "border-top:1px solid #f0ebed;"
    const width = first ? "width:40%;" : ""
    return `                          <tr><td style="${pad}font-size:12px;text-transform:uppercase;color:#7a7a94;letter-spacing:1px;${width}${border}">${label}</td><td style="${pad}font-weight:600;color:#1a1a4b;${border}">${value}</td></tr>`
  })
  .join("\n")}
                        </table>
                      </td></tr>
                    </table>`

function shell(p: Parts): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SEMZO PRIVÉ · ${p.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Great+Vibes&display=swap" rel="stylesheet" />
  <style>
    @media only screen and (max-width: 480px) {
      .responsive-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f9f8f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- CONTENEDOR PRINCIPAL -->
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0; background-color:#ffffff;">

        <!-- 1. LOGO EN CABECERA -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:32px 20px 20px 20px;">
              <img src="https://semzoprive.com/images/logo-semzo-prive.png"
                   alt="SEMZO PRIVÉ"
                   width="180"
                   style="display:block;height:auto;max-width:180px;border:0;" />
            </td>
          </tr>
        </table>

        <!-- 2. EYEBROW + TITULAR -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 30px 6px 30px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a96e;font-weight:500;">
                ${p.eyebrow}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 30px 8px 30px;">
              <h1 class="responsive-title" style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:${p.headingSize ?? 28}px;line-height:1.3;color:#1a1a4b;letter-spacing:-0.3px;">
                ${p.headingHtml}
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 0 24px 0;">
              <div style="width:40px;height:2px;background-color:#c9a96e;margin:0 auto;"></div>
            </td>
          </tr>
        </table>

        <!-- 3. CUERPO DEL EMAIL -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-family:'Playfair Display',Georgia,serif;font-size:17px;line-height:1.7;padding:0;">
${p.bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
${p.afterBodyHtml || ""}${
  p.centralPhrase
    ? `
        <!-- 4. FRASE CENTRAL -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 30px 20px 30px;">
              <p style="margin:0;font-size:17px;line-height:1.7;color:#1a1a4b;text-align:center;font-style:italic; font-family:'Playfair Display',Georgia,serif;">
                ${p.centralPhrase}
              </p>
            </td>
          </tr>
        </table>
`
    : ""
}
        <!-- 5. CTA PRINCIPAL -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:10px 20px ${p.ctaNote ? "12px" : "36px"} 20px;">
              <a href="${p.ctaHref}" style="display:inline-block;background-color:#1a1a4b;color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;padding:18px 56px;letter-spacing:2px;text-transform:uppercase;border:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
                ${p.ctaLabel}
              </a>
            </td>
          </tr>${
            p.ctaNote
              ? `
          <tr>
            <td align="center" style="padding:0 20px 30px 20px;">
              <p style="margin:0;font-size:15px;color:#7a7a94;font-family:'Playfair Display',Georgia,serif;font-style:italic;">
                ${p.ctaNote}
              </p>
            </td>
          </tr>`
              : ""
          }
        </table>

        <!-- 6. BLOQUE FINAL EDITORIAL (FIJO) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:10px;">
          <tr>
            <td align="center" style="padding:0 20px 30px 20px;">

              <p style="margin:0 0 0 0;font-family:'Great Vibes',cursive;font-size:42px;color:#1a1a4b;text-align:center;letter-spacing:1px;line-height:1.2;">
                Erika
              </p>
              <p style="margin:4px 0 0 0;font-size:14px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.5px;text-align:center;">
                Fundadora de SEMZO PRIVÉ
              </p>

              <div style="width:30px;height:1px;background-color:#c9a96e;margin:20px auto 18px auto;"></div>

              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:18px;line-height:1.5;font-style:italic;color:#1a1a4b;text-align:center;letter-spacing:-0.2px;">
                "El verdadero lujo no consiste en tener más.<br />Consiste en elegir mejor."
              </p>

              <div style="width:40px;height:1px;background-color:#c9a96e;margin:24px auto 20px auto;"></div>

              <p style="margin:0 0 2px 0;font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:600;color:#1a1a4b;letter-spacing:0.5px;text-align:center;">
                SEMZO PRIVÉ
              </p>
              <p style="margin:0 0 0 0;font-family:'Playfair Display',Georgia,serif;font-size:14px;font-style:italic;color:#7a7a94;text-align:center;letter-spacing:0.3px;">
                Tu puerta de acceso al armario de tus sueños
              </p>

              <div style="height:18px;"></div>

              <!-- REDES SOCIALES -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://instagram.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/instagram/1e1b4b" width="24" height="24" alt="Instagram" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://pinterest.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/pinterest/1e1b4b" width="24" height="24" alt="Pinterest" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://tiktok.com/@semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/tiktok/1e1b4b" width="24" height="24" alt="TikTok" style="display:block;border:0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:10px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.5px;padding-top:4px;">Instagram</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.5px;padding-top:4px;">Pinterest</td>
                  <td align="center" style="font-size:10px;color:#7a7a94;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.5px;padding-top:4px;">TikTok</td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- 7. COPYRIGHT -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 14px 20px;font-size:9px;color:#d0d0d0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:0.3px;">
              <span>© 2026 SEMZO PRIVÉ</span>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`
}

const PAYMENT_EYEBROW = "Gestión de membresía"
const UPDATE_PAYMENT_CTA = { ctaLabel: "Actualizar método de pago", ctaHref: "{{url_actualizar_pago}}" }

export const PAYMENT_FAILED_1 = {
  subject: "Un pequeño detalle con tu método de pago",
  html: shell({
    title: "Actualiza tu método de pago",
    eyebrow: PAYMENT_EYEBROW,
    headingHtml: "Un pequeño detalle con<br />tu método de pago",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Intentamos procesar el pago de tu membresía <strong>{{tier}}</strong> hoy, pero tu entidad bancaria no lo ha autorizado."),
      P("Sabemos que estas cosas pasan — a veces es una tarjeta que ha caducado, un límite temporal o una medida de seguridad del banco."),
      P("No te preocupes. Tu acceso a la colección sigue activo. Solo necesitamos que actualices tus datos de facturación para que no se interrumpa el servicio."),
    ].join("\n"),
    centralPhrase: "Tómate un minuto para actualizar tu método de pago y seguir disfrutando del club sin interrupciones.",
    ...UPDATE_PAYMENT_CTA,
    ctaNote: "Si crees que se trata de un error, responde a este email.",
  }),
}

export const PAYMENT_FAILED_2 = {
  subject: "Seguimos sin poder procesar el pago de tu membresía",
  html: shell({
    title: "Seguimos sin poder procesar tu pago",
    eyebrow: PAYMENT_EYEBROW,
    headingHtml: "Seguimos sin poder<br />procesar tu pago",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Seguimos sin poder procesar el pago de tu membresía <strong>{{tier}}</strong>."),
      P("No queremos que te pierdas las nuevas incorporaciones de esta temporada. Para mantener tu acceso al club y seguir disfrutando de tus beneficios, solo necesitas actualizar tu método de pago. Es un proceso de un minuto."),
    ].join("\n"),
    ...UPDATE_PAYMENT_CTA,
  }),
}

export const PAYMENT_FAILED_3 = {
  subject: "Último aviso sobre el pago de tu membresía",
  html: shell({
    title: "Último aviso",
    eyebrow: PAYMENT_EYEBROW,
    headingHtml: "Último aviso<br />sobre tu membresía",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Este es nuestro último aviso. Si no podemos procesar el pago de tu membresía en las próximas 24 horas, nos veremos obligados a suspender tu acceso al club de forma temporal."),
      P("Nos encantaría que siguieras formando parte de esta comunidad. Si se trata de un error o necesitas ayuda, responde a este email y lo resolvemos juntas."),
    ].join("\n"),
    ...UPDATE_PAYMENT_CTA,
  }),
}

export const PAYMENT_RECEIPT = {
  subject: "Pago recibido · SEMZO PRIVÉ",
  html: shell({
    title: "Pago recibido",
    eyebrow: "Confirmación de pago",
    headingHtml: "Pago recibido",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Hemos recibido correctamente tu pago de <strong>{{importe}}€</strong>. Adjuntamos los detalles de la transacción."),
      dataTable([
        ["Fecha", "{{fecha_pago}}"],
        ["Concepto", "{{concepto}}"],
        ["Método", "{{metodo_pago}}"],
        ["Total", "{{importe}}€"],
      ]),
      '<p style="margin:0 0 20px 0;text-align:center;font-style:italic;">Gracias por confiar en nosotros para vivir el lujo de otra manera.</p>',
    ].join("\n"),
    ctaLabel: "Ver mi cuenta",
    ctaHref: "https://semzoprive.com/dashboard",
  }),
}

export const REFUND = {
  subject: "Reembolso procesado · SEMZO PRIVÉ",
  html: shell({
    title: "Reembolso procesado",
    eyebrow: "Confirmación de reembolso",
    headingHtml: "Reembolso procesado",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Te confirmamos que hemos procesado el reembolso de <strong>{{importe}}€</strong> correspondiente a {{concepto}}."),
      P("Dependiendo de tu entidad bancaria, puede tardar de 3 a 5 días hábiles en reflejarse en tu cuenta."),
      P("Si tienes cualquier duda, aquí estamos."),
    ].join("\n"),
    ctaLabel: "Contactar con soporte",
    ctaHref: "mailto:soporte@semzoprive.com",
  }),
}

export const MEMBERSHIP_RENEWED = {
  subject: "Tu membresía se ha renovado · SEMZO PRIVÉ",
  html: shell({
    title: "Membresía renovada",
    eyebrow: "Renovación",
    headingHtml: "Tu membresía<br />se ha renovado",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Tu membresía <strong>{{tier}}</strong> se ha renovado correctamente. Tu nuevo ciclo ya está activo."),
      dataTable([
        ["Importe", "{{importe}}€"],
        ["Próxima renovación", "{{fecha_renovacion}}"],
      ]),
      P("La colección está lista para que elijas tu próximo bolso."),
    ].join("\n"),
    ctaLabel: "Elegir mi próximo bolso",
    ctaHref: "https://semzoprive.com/catalog",
  }),
}

/**
 * Venta Colecciona completada ("Compra confirmada"). Variables: {{nombre}} {{nombre_bolso}} {{importe}} {{url_factura}}
 * y {{frase_contrato}} (HTML fijo: con el PDF adjunto o, si no se pudo generar, aviso de que estara en el panel).
 */
export const COLECCIONA_SALE = {
  html: shell({
    title: "Compra confirmada",
    eyebrow: "Compra confirmada",
    headingHtml: "Enhorabuena, {{nombre}}",
    headingSize: 32,
    bodyHtml: [
      '<p style="margin:0 0 24px 0;">Hola {{nombre}},</p>',
      '<p style="margin:0 0 24px 0;"><strong>{{nombre_bolso}}</strong> es ahora tuyo. Hemos recibido tu pago.</p>',
      `
                    <!-- TABLA DE DATOS -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:24px;">
                      <tr>
                        <td style="padding:12px 0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;text-transform:uppercase;color:#7a7a94;letter-spacing:1px;border-bottom:1px solid #f0ebed;width:40%;">Bolso</td>
                        <td style="padding:12px 0;font-weight:600;color:#1a1a4b;border-bottom:1px solid #f0ebed;">{{nombre_bolso}}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;text-transform:uppercase;color:#7a7a94;letter-spacing:1px;border-bottom:1px solid #f0ebed;">Importe pagado</td>
                        <td style="padding:12px 0;font-weight:600;color:#1a1a4b;border-bottom:1px solid #f0ebed;">{{importe}}€</td>
                      </tr>
                    </table>`,
    ].join("\n"),
    afterBodyHtml: `
        <!-- BLOQUE ROSA (Contrato y Factura) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 24px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;background-color:#fff0f3; border-left:3px solid #c9a96e;">
                <tr>
                  <td style="padding:20px;color:#1a1a4b;font-size:15px;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                    <p style="margin:0 0 12px 0;">{{frase_contrato}}</p>
                    <p style="margin:0;">Tu factura: <a href="{{url_factura}}" style="color:#1a1a4b;text-decoration:underline;font-weight:600;">ver y descargar factura</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- AVISO DE DESISTIMIENTO -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="color:#1a1a4b;font-family:'Playfair Display',Georgia,serif;font-size:16px;line-height:1.7;padding:0;">
                    <p style="margin:0 0 24px 0;">Dispones de <strong>14 días naturales</strong> para desistir de la compra si lo deseas; el formulario está en el Anexo II del contrato. Tu membresía sigue activa como siempre.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
`,
    ctaLabel: "Ir a mi cuenta",
    ctaHref: "https://semzoprive.com/dashboard",
    ctaNote: '¿Dudas? Escríbenos a <a href="mailto:info@semzoprive.com" style="color:#1a1a4b;text-decoration:underline;">info@semzoprive.com</a>.',
  }),
}

/**
 * Aviso previo de cargo SEPA (bolso no devuelto). Variables: {{nombre}} {{nombre_bolso}} {{fecha_limite}} {{importe}}
 * {{iban_masked}} {{fecha_cargo}}. Boton: "Contactar con soporte" (mailto).
 */
export const SEPA_PRE_NOTICE = {
  subject: "Aviso previo de cargo · SEMZO PRIVÉ",
  html: shell({
    title: "Aviso de cargo pendiente",
    eyebrow: "Gestión de contrato",
    headingHtml: "Aviso previo de cargo",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Te escribimos para informarte de que no hemos registrado la devolución de tu bolso <strong>{{nombre_bolso}}</strong>, cuya fecha límite era el {{fecha_limite}}."),
      '<p style="margin:0 0 24px 0;">Tal y como se estipula en los Términos y Condiciones de tu membresía, al no haber recibido la pieza, procederemos a ejecutar el cargo correspondiente al valor del bolso a través de tu mandato SEPA.</p>',
      dataTable([
        ["Bolso", "{{nombre_bolso}}"],
        ["Importe a cobrar", "{{importe}}€"],
        ["Cuenta de cargo", "{{iban_masked}}"],
      ]),
      P("Si ya has enviado el bolso, por favor, ignora este mensaje. Si necesitas asistencia para la recogida, responde a este email antes del {{fecha_cargo}}."),
    ].join("\n"),
    ctaLabel: "Contactar con soporte",
    ctaHref: "mailto:soporte@semzoprive.com",
  }),
}

/**
 * Cargo SEPA ejecutado por no devolución ("Cargo por no devolución"). Variables: {{nombre}} {{nombre_bolso}}
 * {{importe}}. Boton: "Ir a mi cuenta". Solo se envía cuando Stripe CONFIRMA el cobro.
 */
export const SEPA_EXECUTION = {
  subject: "Cargo por no devolución · SEMZO PRIVÉ",
  html: shell({
    title: "Cargo por no devolución",
    eyebrow: "Notificación financiera",
    headingHtml: "Cargo por no devolución",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Te confirmamos que se ha ejecutado el cargo correspondiente al valor de tu <strong>{{nombre_bolso}}</strong> a través de tu cuenta bancaria."),
      '<p style="margin:0 0 24px 0;">A partir de este momento, el bolso pasa a ser de tu propiedad y consideramos cerrada la incidencia de devolución.</p>',
      dataTable([
        ["Concepto", "Compra {{nombre_bolso}}"],
        ["Importe cobrado", "{{importe}}€"],
        ["Estado", "Procesado"],
      ]),
      P("Adjuntamos la factura correspondiente a tu panel de usuario. Si tienes cualquier duda sobre este proceso, nuestro equipo está a tu disposición."),
    ].join("\n"),
    ctaLabel: "Ir a mi cuenta",
    ctaHref: "https://semzoprive.com/dashboard",
  }),
}

/**
 * Cargo SEPA por no devolución RECHAZADO por el banco (p. ej. fondos insuficientes). Variables: {{nombre}}
 * {{nombre_bolso}} {{importe}} {{url_pago}}. Boton: "Completar el pago" -> pago manual desde su panel.
 */
export const SEPA_CHARGE_FAILED = {
  subject: "No hemos podido procesar el cargo · SEMZO PRIVÉ",
  html: shell({
    title: "Pago pendiente",
    eyebrow: "Aviso de pago pendiente",
    headingHtml: "No hemos podido procesar el cargo",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Te escribimos para informarte de que el intento de cobro correspondiente al bolso <strong>{{nombre_bolso}}</strong> (que no fue devuelto en el plazo acordado) ha sido rechazado por tu entidad bancaria."),
      '<p style="margin:0 0 24px 0;">Para regularizar tu situación y evitar cargos adicionales por demora, necesitamos que completes el pago de forma manual a través de tu panel de usuario. Puedes hacerlo fácilmente con tarjeta u otro método disponible.</p>',
      dataTable([
        ["Concepto", "Compra {{nombre_bolso}}"],
        ["Importe pendiente", "{{importe}}€"],
        ["Estado", "Pendiente de pago"],
      ]),
      P("Si necesitas ayuda para resolverlo o crees que se trata de un error, responde directamente a este correo."),
    ].join("\n"),
    ctaLabel: "Completar el pago",
    ctaHref: "{{url_pago}}",
  }),
}

/**
 * Pago manual recibido de un cargo por no devolución que el banco había rechazado (variante de "Cargo por no
 * devolución" para cuando la socia paga ella misma con tarjeta u otro método desde su panel).
 * Texto de Erika (2026-10-19). Variables: {{nombre}} {{nombre_bolso}} {{importe}}. Boton: "Ir a mi cuenta".
 */
export const SEPA_MANUAL_PAID = {
  subject: "Pago recibido · SEMZO PRIVÉ",
  html: shell({
    title: "Pago recibido",
    eyebrow: "Confirmación de pago",
    headingHtml: "Pago recibido",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Te confirmamos que hemos recibido correctamente el pago de <strong>{{importe}}€</strong> correspondiente a tu <strong>{{nombre_bolso}}</strong>."),
      '<p style="margin:0 0 24px 0;">Gracias por regularizar la situación. A partir de este momento, el bolso pasa a ser de tu propiedad y consideramos cerrada la incidencia de devolución.</p>',
      dataTable([
        ["Concepto", "Compra {{nombre_bolso}}"],
        ["Importe pagado", "{{importe}}€"],
        ["Estado", "Procesado"],
      ]),
      '<p style="margin:0 0 20px 0;font-size:15px;color:#7a7a94;font-style:italic;text-align:center;">El justificante oficial de pago te llegará por separado junto con tu factura.</p>',
    ].join("\n"),
    ctaLabel: "Ir a mi cuenta",
    ctaHref: "https://semzoprive.com/dashboard",
  }),
}

/**
 * Membresía suspendida por impago CON UN BOLSO EN CASA: se pide la devolución.
 * Variables: {{nombre}} {{tier}} {{nombre_bolso}} {{fecha_limite}} {{url_panel}}. Boton: "Gestionar la devolución".
 * TEXTO PROVISIONAL (pendiente de la redacción final de Erika).
 */
export const SUSPENDED_RETURN = {
  subject: "Tu membresía está suspendida: necesitamos tu bolso · SEMZO PRIVÉ",
  html: shell({
    title: "Devolución de tu bolso",
    eyebrow: "Membresía suspendida",
    headingHtml: "Necesitamos que nos<br />devuelvas tu bolso",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("No hemos podido cobrar tu membresía <strong>{{tier}}</strong> y, tras nuestros avisos, tu acceso ha quedado suspendido."),
      P("Todavía tienes contigo <strong>{{nombre_bolso}}</strong>. Te pedimos que lo devuelvas antes del <strong>{{fecha_limite}}</strong> desde tu panel; el envío de vuelta va incluido."),
      P("Si no lo recibimos en ese plazo, aplicaremos lo previsto en los Términos y Condiciones de tu membresía, que incluye el cargo del valor del bolso. Puedes evitarlo regularizando tu pago o devolviendo la pieza."),
    ].join("\n"),
    ctaLabel: "Gestionar la devolución",
    ctaHref: "{{url_panel}}",
    ctaNote: "Si crees que se trata de un error, responde a este email.",
  }),
}

/** Devolución recibida y verificada. Variables: {{nombre}} {{nombre_bolso}}. Botón: "Ir a mi cuenta". */
export const RETURN_RECEIVED = {
  subject: "Hemos recibido tu devolución · SEMZO PRIVÉ",
  html: shell({
    title: "Devolución recibida",
    eyebrow: "Devolución completada",
    headingHtml: "Hemos recibido tu devolución",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Te confirmamos que tu <strong>{{nombre_bolso}}</strong> ha llegado de vuelta a nuestras instalaciones sano y salvo."),
      P("Gracias por haberlo cuidado con tanto esmero. Nuestro equipo ya está revisando la pieza para prepararla para su próxima socia."),
      P("Si tenías reservado un nuevo bolso, el proceso de envío se activará automáticamente en las próximas horas."),
    ].join("\n"),
    ctaLabel: "Ir a mi cuenta",
    ctaHref: "https://semzoprive.com/dashboard",
  }),
}

/**
 * Aviso a la socia: la etiqueta de devolución sigue sin escanear (pre-admisión) al vencer.
 * Variables: {{nombre}} {{nombre_bolso}} {{url_etiqueta_correos}}. Botón: "Descargar etiqueta".
 */
export const RETURN_LABEL_REMINDER = {
  subject: "Tu paquete te está esperando · SEMZO PRIVÉ",
  html: shell({
    title: "Etiqueta de devolución",
    eyebrow: "Etiqueta de devolución",
    headingHtml: "Tu paquete te está esperando",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Queremos recordarte que tienes el <strong>{{nombre_bolso}}</strong> pendiente de devolución."),
      P("Vemos que la etiqueta prepagada aún no ha sido escaneada. Para que podamos preparar tu próximo bolso, solo necesitas llevar el paquete a cualquier oficina de Correos. No tienes que pagar nada, solo entregarlo."),
      P("Si ya lo has entregado en las últimas horas, ignora este mensaje."),
    ].join("\n"),
    ctaLabel: "Descargar etiqueta",
    ctaHref: "{{url_etiqueta_correos}}",
  }),
}

/** Recogida confirmada (día y franja). Variables: {{nombre}} {{nombre_bolso}} {{dia_recogida}} {{franja_horaria}}. */
export const PICKUP_CONFIRMED = {
  subject: "Tu recogida está confirmada · SEMZO PRIVÉ",
  html: shell({
    title: "Recogida confirmada",
    eyebrow: "Recogida programada",
    headingHtml: "Tu recogida está confirmada",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Ya tenemos la fecha y hora para recoger tu <strong>{{nombre_bolso}}</strong>. El mensajero pasará por tu dirección en la siguiente franja horaria:"),
      dataTable([
        ["Día", "{{dia_recogida}}"],
        ["Franja horaria", "{{franja_horaria}}"],
      ]),
      P("Por favor, asegúrate de que el bolso esté dentro de su funda y listo para ser entregado. Si no hay nadie en el domicilio, la agencia intentará contactarte."),
    ].join("\n"),
    ctaLabel: "Ir a mi cuenta",
    ctaHref: "https://semzoprive.com/dashboard",
  }),
}

/**
 * Desistimiento de una compra Colecciona procesado (compra anulada y reembolso). Variables: {{nombre}}
 * {{nombre_bolso}} {{importe}}. Botón: "Ir a mi cuenta". Lo envía la anulación de venta del admin.
 */
export const WITHDRAWAL_PROCESSED = {
  subject: "Hemos procesado tu desistimiento · SEMZO PRIVÉ",
  html: shell({
    title: "Desistimiento procesado",
    eyebrow: "Compra anulada",
    headingHtml: "Hemos procesado tu desistimiento",
    bodyHtml: [
      P("Hola {{nombre}},"),
      P("Te confirmamos que hemos procesado el desistimiento de tu compra correspondiente al <strong>{{nombre_bolso}}</strong>."),
      '<p style="margin:0 0 24px 0;">Entendemos perfectamente que, en ocasiones, una pieza no termina de encajar. En SEMZO PRIVÉ queremos que tu experiencia sea perfecta en todos los sentidos, y tu tranquilidad es lo primero.</p>',
      dataTable([
        ["Bolso", "{{nombre_bolso}}"],
        ["Importe a reembolsar", "{{importe}}€"],
        ["Estado", "Reembolso en proceso"],
      ]),
      P("Hemos iniciado el reembolso a tu método de pago original. Dependiendo de tu entidad bancaria, verás el abono reflejado en los próximos <strong>3 a 5 días hábiles</strong>."),
      P("Si el bolso aún está en tu domicilio, recuerda que puedes utilizar el sobre de devolución prepagado que incluimos en el paquete para hacérnoslo llegar."),
      '<p style="margin:0 0 20px 0;font-style:italic;text-align:center;">Gracias por haber confiado en nosotros. Las puertas del club siempre estarán abiertas para ti.</p>',
    ].join("\n"),
    ctaLabel: "Ir a mi cuenta",
    ctaHref: "https://semzoprive.com/dashboard",
    ctaNote: '¿Tienes alguna duda? Escríbenos a <a href="mailto:soporte@semzoprive.com" style="color:#1a1a4b;text-decoration:underline;">soporte@semzoprive.com</a>',
  }),
}
