import { EmailLayout } from "../layout"
import { CtaButton, InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface WelcomeEmailProps {
  name: string
  confirmationUrl: string
  locale?: Locale
}

export default function WelcomeEmail({ name, confirmationUrl, locale = "es" }: WelcomeEmailProps) {
  const t = getMessages(locale)
  const firstName = name?.split(" ")[0] || ""

  return (
    <EmailLayout locale={locale} preview={t.welcome.preheader} eyebrow={t.welcome.eyebrow}>
      <Heading>{t.welcome.heading(firstName)}</Heading>
      <Paragraph>{t.welcome.intro}</Paragraph>
      <Paragraph>{t.welcome.confirmPrompt}</Paragraph>
      <InfoBox>
        <strong>{t.welcome.benefitsTitle}</strong>
        <ul style={{ margin: "12px 0 0 0", paddingLeft: 18 }}>
          {t.welcome.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </InfoBox>
      <CtaButton label={t.welcome.cta} url={confirmationUrl} accent="gold" />
      <p style={{ margin: "24px 0 0 0", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, lineHeight: 1.6, color: "#6b6b6b" }}>
        {t.welcome.footerNote}
      </p>
    </EmailLayout>
  )
}
