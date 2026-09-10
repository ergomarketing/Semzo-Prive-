import { EmailLayout } from "../layout"
import type { Locale } from "../messages"

export interface LifecycleSequenceEmailProps {
  /** HTML editable desde lifecycle_email_templates. Es la fuente de verdad del copy. */
  bodyHtml: string
  locale?: Locale
}

/**
 * Wrapper compartido para TODAS las secuencias de lifecycle/negocio de la
 * Fase 3 (onboarding, checkout abandonado, renovación, tarjeta por caducar,
 * win-back, reactivación de pausa, back-in-stock, NPS). El copy viene de
 * `lifecycle_email_templates`; aquí solo se aplica el layout de marca.
 * No lleva unsubscribe: estas son comunicaciones transaccionales/de servicio
 * ligadas a la membresía, no marketing de newsletter.
 */
export default function LifecycleSequenceEmail({ bodyHtml, locale = "es" }: LifecycleSequenceEmailProps) {
  return (
    <EmailLayout locale={locale}>
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </EmailLayout>
  )
}
