import { EmailLayout } from "../layout"
import { CtaButton, DetailList, InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface GiftCardRecipientEmailProps {
  recipientName?: string
  personalMessage?: string
  code: string
  amountEuros: string
  redeemUrl: string
  locale?: Locale
}

export default function GiftCardRecipientEmail({
  recipientName,
  personalMessage,
  code,
  amountEuros,
  redeemUrl,
  locale = "es",
}: GiftCardRecipientEmailProps) {
  const t = getMessages(locale)
  const firstName = recipientName?.split(" ")[0] || ""

  return (
    <EmailLayout locale={locale} eyebrow={t.giftCardRecipient.eyebrow}>
      <Heading>{t.giftCardRecipient.heading}</Heading>
      <Paragraph>
        {firstName ? `${t.common.hello(firstName)}, ` : ""}
        {t.giftCardRecipient.intro(locale === "es" ? "Alguien especial" : "Someone special")}
      </Paragraph>
      {personalMessage ? (
        <InfoBox>
          <em>&ldquo;{personalMessage}&rdquo;</em>
        </InfoBox>
      ) : null}
      <DetailList
        rows={[
          { label: t.giftCardRecipient.codeLabel, value: code },
          { label: t.giftCardRecipient.amountLabel, value: `${amountEuros}€` },
        ]}
      />
      <CtaButton label={t.giftCardRecipient.cta} url={redeemUrl} accent="gold" />
      <p style={{ fontSize: 13, color: "#8888aa" }}>
        {locale === "es" ? "Tu Gift Card tiene una validez de 2 años y puede usarse en cualquier membresía o reserva." : "Your Gift Card is valid for 2 years and can be used on any membership or reservation."}
      </p>
    </EmailLayout>
  )
}
