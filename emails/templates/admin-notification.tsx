import { EmailLayout } from "../layout"
import { DetailList, Paragraph, Heading } from "../components/ui"
import { getMessages } from "../messages"

export interface AdminNotificationEmailProps {
  title: string
  intro?: string
  rows: Array<{ label: string; value: string }>
}

/**
 * Plantilla genérica para avisos internos al equipo (mailbox@semzoprive.com):
 * nueva membresía, gift card vendida, pago fallido, etc.
 * Siempre en español — es correo interno del equipo, no de cara a la socia.
 */
export default function AdminNotificationEmail({ title, intro, rows }: AdminNotificationEmailProps) {
  const t = getMessages("es")

  return (
    <EmailLayout locale="es" eyebrow={t.admin.eyebrow}>
      <Heading>{title}</Heading>
      {intro ? <Paragraph>{intro}</Paragraph> : null}
      <DetailList rows={rows} />
      <p style={{ margin: "24px 0 0 0", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, lineHeight: 1.6, color: "#6b6b6b" }}>
        {t.admin.footerNote}
      </p>
    </EmailLayout>
  )
}
