import { EmailLayout } from "../layout"
import { BagCard } from "../components/bag-card"
import { CtaButton, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface OwnershipCompletedEmailProps {
  name: string
  bagBrand?: string
  bagName?: string
  bagImageUrl?: string | null
  ctaUrl: string
  ctaLabel?: string
  locale?: Locale
}

/**
 * Se envía cuando la socia completa el pago acumulado (modo "colecciona") de un bolso.
 * Si se dispone de los datos del bolso se muestra la BagCard; el CTA lleva al último
 * paso (finalizar compra) o a la colección, según el contexto de envío.
 */
export default function OwnershipCompletedEmail({
  name,
  bagBrand,
  bagName,
  bagImageUrl,
  ctaUrl,
  ctaLabel,
  locale = "es",
}: OwnershipCompletedEmailProps) {
  const t = getMessages(locale)
  const firstName = name?.split(" ")[0] || ""
  const bagLabel = bagBrand && bagName ? `${bagBrand} ${bagName}` : locale === "es" ? "tu bolso" : "your bag"

  return (
    <EmailLayout locale={locale} eyebrow={t.ownershipCompleted.eyebrow}>
      <Heading>{t.ownershipCompleted.heading}</Heading>
      <Paragraph>
        {t.common.hello(firstName)}, {t.ownershipCompleted.intro(bagLabel)}
      </Paragraph>
      {bagBrand && bagName ? <BagCard brand={bagBrand} name={bagName} imageUrl={bagImageUrl} /> : null}
      <CtaButton label={ctaLabel || t.ownershipCompleted.cta} url={ctaUrl} accent="gold" />
    </EmailLayout>
  )
}
