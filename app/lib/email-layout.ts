/**
 * Sistema de plantillas de correo de marca SEMZO PRIVÉ.
 *
 * Todos los correos deben construir su contenido interno y envolverlo con
 * `renderBrandEmail` para garantizar una identidad visual coherente
 * (azul marino + dorado, tipografia serif en titulares) y compatibilidad
 * con clientes de correo (estructura basada en tablas + estilos inline).
 */

export const BRAND = {
  navy: "#1a1a4b",
  navyDark: "#12122f",
  gold: "#c6a15b",
  goldSoft: "#e9dcc0",
  ink: "#2b2b2b",
  muted: "#6b6b6b",
  cream: "#f5f2ec",
  card: "#ffffff",
  border: "#e7e1d6",
  success: "#2f7d54",
  successBg: "#e9f4ee",
  warning: "#9a6a12",
  warningBg: "#fbf3e2",
  danger: "#a33131",
  dangerBg: "#f8ecec",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "Helvetica, Arial, sans-serif",
  site: "https://semzoprive.com",
  supportEmail: "soporte@semzoprive.com",
  address: "Avenida Ricardo Soriano, Marbella, España",
} as const

type Accent = "gold" | "success" | "warning" | "danger" | "navy"

function accentColor(accent: Accent = "gold"): string {
  switch (accent) {
    case "success":
      return BRAND.success
    case "warning":
      return BRAND.warning
    case "danger":
      return BRAND.danger
    case "navy":
      return BRAND.navy
    default:
      return BRAND.gold
  }
}

function accentBg(accent: Accent = "gold"): string {
  switch (accent) {
    case "success":
      return BRAND.successBg
    case "warning":
      return BRAND.warningBg
    case "danger":
      return BRAND.dangerBg
    default:
      return BRAND.cream
  }
}

/** Boton principal de marca. */
export function emailButton(label: string, url: string, accent: Accent = "navy"): string {
  const bg = accent === "gold" ? BRAND.gold : BRAND.navy
  const color = accent === "gold" ? BRAND.navy : "#ffffff"
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
      <tr>
        <td align="center" bgcolor="${bg}" style="border-radius:2px;">
          <a href="${url}" target="_blank"
             style="display:inline-block;padding:14px 34px;font-family:${BRAND.sans};font-size:12px;
                    letter-spacing:1.5px;text-transform:uppercase;color:${color};text-decoration:none;font-weight:bold;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

/** Caja de detalle con acento lateral (para bloques de datos destacados). */
export function emailInfoBox(innerHtml: string, accent: Accent = "gold"): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:${accentBg(accent)};border-left:3px solid ${accentColor(accent)};
                   padding:18px 22px;font-family:${BRAND.sans};font-size:15px;line-height:1.7;color:${BRAND.ink};">
          ${innerHtml}
        </td>
      </tr>
    </table>`
}

/** Lista de pares etiqueta/valor, para resumenes de reserva, pago, envio, etc. */
export function emailDetailList(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 0;font-family:${BRAND.sans};font-size:13px;letter-spacing:0.5px;
                   text-transform:uppercase;color:${BRAND.muted};width:42%;vertical-align:top;">${r.label}</td>
        <td style="padding:8px 0;font-family:${BRAND.sans};font-size:15px;color:${BRAND.ink};font-weight:bold;">${r.value}</td>
      </tr>`,
    )
    .join("")
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin:24px 0;border-top:1px solid ${BRAND.border};border-bottom:1px solid ${BRAND.border};">
      ${body}
    </table>`
}

export interface BrandEmailOptions {
  /** Texto de preview (preheader) que muestran las bandejas antes de abrir. */
  preheader?: string
  /** Pequeño rotulo sobre el titular (p.ej. "Reserva confirmada"). */
  eyebrow?: string
  /** Titular principal del correo. */
  heading: string
  /** Contenido HTML del cuerpo (parrafos, cajas, botones...). */
  bodyHtml: string
  /** Boton de llamada a la accion opcional. */
  cta?: { label: string; url: string; accent?: Accent }
  /** Nota final discreta bajo el cuerpo (p.ej. aviso de seguridad). */
  footerNote?: string
}

/** Envuelve el contenido de un correo en la plantilla de marca SEMZO PRIVÉ. */
export function renderBrandEmail(opts: BrandEmailOptions): string {
  const { preheader, eyebrow, heading, bodyHtml, cta, footerNote } = opts
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:${BRAND.card};border:1px solid ${BRAND.border};">
          <!-- Cabecera -->
          <tr>
            <td align="center" style="background:${BRAND.navy};padding:36px 24px;">
              <div style="font-family:${BRAND.serif};font-size:26px;letter-spacing:6px;color:#ffffff;text-transform:uppercase;">
                Semzo&nbsp;Privé
              </div>
              <div style="margin-top:8px;font-family:${BRAND.sans};font-size:10px;letter-spacing:3px;
                          text-transform:uppercase;color:${BRAND.goldSoft};">
                Maison de bolsos de lujo
              </div>
            </td>
          </tr>
          <!-- Filete dorado -->
          <tr><td style="height:3px;background:${BRAND.gold};line-height:3px;font-size:0;">&nbsp;</td></tr>
          <!-- Contenido -->
          <tr>
            <td style="padding:40px 40px 8px 40px;">
              ${
                eyebrow
                  ? `<div style="font-family:${BRAND.sans};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;
                                color:${BRAND.gold};margin-bottom:12px;">${eyebrow}</div>`
                  : ""
              }
              <h1 style="margin:0 0 20px 0;font-family:${BRAND.serif};font-size:26px;line-height:1.3;
                         font-weight:normal;color:${BRAND.navy};">${heading}</h1>
              <div style="font-family:${BRAND.sans};font-size:15px;line-height:1.7;color:${BRAND.ink};">
                ${bodyHtml}
              </div>
              ${cta ? emailButton(cta.label, cta.url, cta.accent ?? "navy") : ""}
              ${
                footerNote
                  ? `<p style="margin:24px 0 0 0;font-family:${BRAND.sans};font-size:12px;line-height:1.6;color:${BRAND.muted};">${footerNote}</p>`
                  : ""
              }
            </td>
          </tr>
          <tr><td style="padding:0 40px;"><div style="height:1px;background:${BRAND.border};margin-top:32px;"></div></td></tr>
          <!-- Pie -->
          <tr>
            <td align="center" style="padding:28px 40px 36px 40px;">
              <div style="font-family:${BRAND.serif};font-size:15px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.navy};">
                Semzo Privé
              </div>
              <p style="margin:10px 0 0 0;font-family:${BRAND.sans};font-size:12px;line-height:1.6;color:${BRAND.muted};">
                ${BRAND.address}<br>
                <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.muted};text-decoration:underline;">${BRAND.supportEmail}</a>
                &nbsp;·&nbsp;
                <a href="${BRAND.site}" style="color:${BRAND.muted};text-decoration:underline;">semzoprive.com</a>
              </p>
              <p style="margin:14px 0 0 0;font-family:${BRAND.sans};font-size:11px;color:${BRAND.muted};">
                © ${year} Semzo Privé. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Plantilla compacta para avisos internos al equipo (panel admin). */
export function renderAdminEmail(opts: {
  title: string
  intro?: string
  rows: Array<{ label: string; value: string }>
  accent?: Accent
}): string {
  const { title, intro, rows, accent = "navy" } = opts
  return renderBrandEmail({
    eyebrow: "Aviso interno",
    heading: title,
    bodyHtml: `
      ${intro ? `<p style="margin:0 0 8px 0;">${intro}</p>` : ""}
      ${emailDetailList(rows)}
    `,
    footerNote: "Correo automático del sistema Semzo Privé.",
  }).replace("Maison de bolsos de lujo", "Panel de administración")
}
