import { EmailLayout } from "../layout"
import { CtaButton, DetailList, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface MembershipRenewedEmailProps {
  name: string
  amount: string
  invoiceNumber?: string
  invoiceUrl?: string
  dashboardUrl: string
  locale?: Locale
}

export default function MembershipRenewedEmail({
  name,
  amount,
  invoiceNumber,
  invoiceUrl,
  dashboardUrl,
  locale = "es",
}: MembershipRenewedEmailProps) {
  const t = getMessages(locale)
  const firstName = name?.split(" ")[0] || ""
  const rows = [{ label: locale === "es" ? "Importe cobrado" : "Amount charged", value: `${amount}€` }]
  if (invoiceNumber) rows.push({ label: locale === "es" ? "Número de factura" : "Invoice number", value: invoiceNumber })

  return (
    <EmailLayout locale={locale} eyebrow={t.membershipRenewed.eyebrow}>
      <Heading>{t.membershipRenewed.heading}</Heading>
      <Paragraph>
        {t.common.hello(firstName)},{" "}
        {locale === "es"
          ? "tu membresía ha sido renovada correctamente y se ha emitido una nueva factura."
          : "your membership has been renewed successfully and a new invoice has been issued."}
      </Paragraph>
      <DetailList rows={rows} />
      {invoiceUrl ? <CtaButton label={locale === "es" ? "Descargar factura" : "Download invoice"} url={invoiceUrl} accent="gold" /> : null}
      <CtaButton label={t.membershipRenewed.cta} url={dashboardUrl} />
    </EmailLayout>
  )
}
