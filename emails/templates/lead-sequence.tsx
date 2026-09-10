import { EmailLayout } from "../layout"
import type { Locale } from "../messages"

export interface LeadSequenceEmailProps {
  /** HTML editable desde el panel admin (tabla email_templates). Es la fuente de verdad del copy. */
  bodyHtml: string
  unsubscribeUrl: string
  locale?: Locale
}

/**
 * Wrapper de la secuencia de leads: el copy sigue viniendo de la tabla
 * `email_templates` (editable desde el panel admin), pero se envuelve con
 * el layout de marca compartido para mantener header/footer/unsubscribe
 * consistentes con el resto de emails.
 */
export default function LeadSequenceEmail({ bodyHtml, unsubscribeUrl, locale = "es" }: LeadSequenceEmailProps) {
  return (
    <EmailLayout locale={locale} unsubscribeUrl={unsubscribeUrl}>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </EmailLayout>
  )
}
