import { EmailLayout } from "../layout"
import { CtaButton, InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface DunningEmailProps {
  step: 1 | 2 | 3
  name: string
  membershipLabel: string
  bagName?: string
  updatePaymentUrl: string
  locale?: Locale
}

/** Email de dunning (pago fallido) — pasos E1 (inmediato), E2 (+3 días), E3 (+7 días). */
export default function DunningEmail({ step, name, membershipLabel, bagName, updatePaymentUrl, locale = "es" }: DunningEmailProps) {
  const t = getMessages(locale)
  const copy = step === 1 ? t.dunning.e1 : step === 2 ? t.dunning.e2 : t.dunning.e3
  const firstName = name?.split(" ")[0] || ""

  return (
    <EmailLayout locale={locale}>
      <Heading>{copy.heading}</Heading>
      <Paragraph>{t.common.hello(firstName)}</Paragraph>
      <Paragraph>{copy.intro(membershipLabel)}</Paragraph>
      <Paragraph>{copy.body}</Paragraph>
      {bagName ? <InfoBox>{t.dunning.bagNote(bagName)}</InfoBox> : null}
      <CtaButton label={t.dunning.cta} url={updatePaymentUrl} />
      <p style={{ textAlign: "center", fontSize: 13, color: "#8888aa", fontFamily: "Helvetica, Arial, sans-serif" }}>{t.dunning.help}</p>
    </EmailLayout>
  )
}
