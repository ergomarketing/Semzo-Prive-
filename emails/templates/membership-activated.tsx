import { EmailLayout } from "../layout"
import { CtaButton, InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface MembershipActivatedEmailProps {
  name: string
  membershipLabel: string
  dashboardUrl: string
  /** Socia que vuelve tras cancelar o caducar: no se le da la bienvenida de nueva. */
  returning?: boolean
  locale?: Locale
}

export default function MembershipActivatedEmail({
  name,
  membershipLabel,
  dashboardUrl,
  returning = false,
  locale = "es",
}: MembershipActivatedEmailProps) {
  const t = getMessages(locale)
  const es = locale === "es"
  const heading = returning
    ? es
      ? `¡Qué alegría tenerte de vuelta, ${name || ""}!`
      : `So good to have you back, ${name || ""}!`
    : `${es ? "¡Bienvenida" : "Welcome"}, ${name || ""}!`

  return (
    <EmailLayout locale={locale} eyebrow={t.membershipActivated.eyebrow}>
      <Heading>{heading}</Heading>
      <Paragraph>
        {returning
          ? es
            ? `Tu membresía ${membershipLabel} vuelve a estar activa.`
            : `Your ${membershipLabel} membership is active again.`
          : t.membershipActivated.intro(membershipLabel)}
      </Paragraph>
      <InfoBox>
        <strong>{es ? "Ya puedes reservar." : "You can book now."}</strong>{" "}
        {es
          ? "Tu membresía está lista: elige tu próximo bolso en el catálogo."
          : "Your membership is ready: pick your next bag from the catalog."}
      </InfoBox>
      <CtaButton label={es ? "Elegir mi bolso" : "Choose my bag"} url={dashboardUrl} accent="gold" />
    </EmailLayout>
  )
}
