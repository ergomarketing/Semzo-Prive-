import { EmailLayout } from "../layout"
import { CtaButton, InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface MembershipActivatedEmailProps {
  name: string
  membershipLabel: string
  dashboardUrl: string
  locale?: Locale
}

export default function MembershipActivatedEmail({ name, membershipLabel, dashboardUrl, locale = "es" }: MembershipActivatedEmailProps) {
  const t = getMessages(locale)

  return (
    <EmailLayout locale={locale} eyebrow={t.membershipActivated.eyebrow}>
      <Heading>{`${locale === "es" ? "¡Bienvenida" : "Welcome"}, ${name || ""}!`}</Heading>
      <Paragraph>{t.membershipActivated.intro(membershipLabel)}</Paragraph>
      <InfoBox>
        <strong>{locale === "es" ? "Próximo paso:" : "Next step:"}</strong>{" "}
        {locale === "es"
          ? "Completa la verificación de identidad para desbloquear el acceso completo al catálogo."
          : "Complete your identity verification to unlock full access to the catalog."}
      </InfoBox>
      <Paragraph>
        {locale === "es"
          ? "La verificación es rápida y solo toma unos minutos. Una vez completada, podrás reservar cualquier bolso de nuestra colección exclusiva."
          : "Verification is quick and only takes a few minutes. Once completed, you'll be able to reserve any bag from our exclusive collection."}
      </Paragraph>
      <CtaButton label={t.membershipActivated.cta} url={dashboardUrl} accent="gold" />
    </EmailLayout>
  )
}
