import { EmailLayout } from "../layout"
import { Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface NewsletterEmailProps {
  recipientName?: string
  /** Cuerpo HTML editorial (viene del panel admin), se inyecta ya formateado. */
  bodyHtml: string
  unsubscribeUrl: string
  locale?: Locale
}

/** Envuelve el contenido editorial de una campaña de newsletter con el layout de marca. */
export default function NewsletterEmail({ recipientName, bodyHtml, unsubscribeUrl, locale = "es" }: NewsletterEmailProps) {
  const t = getMessages(locale)

  return (
    <EmailLayout locale={locale} unsubscribeUrl={unsubscribeUrl}>
      {recipientName ? <Paragraph>{t.common.hello(recipientName.split(" ")[0])}</Paragraph> : null}
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </EmailLayout>
  )
}
