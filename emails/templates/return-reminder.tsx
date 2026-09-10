import { EmailLayout } from "../layout"
import { BagCard } from "../components/bag-card"
import { CtaButton, InfoBox, Paragraph, Heading } from "../components/ui"
import { getMessages, type Locale } from "../messages"

export interface ReturnReminderEmailProps {
  name: string
  bagBrand: string
  bagName: string
  bagImageUrl?: string | null
  returnByDate: string
  isPetite: boolean
  dashboardUrl: string
  locale?: Locale
}

export default function ReturnReminderEmail({
  name,
  bagBrand,
  bagName,
  bagImageUrl,
  returnByDate,
  isPetite,
  dashboardUrl,
  locale = "es",
}: ReturnReminderEmailProps) {
  const t = getMessages(locale)
  const firstName = name?.split(" ")[0] || ""
  const subtitle = isPetite ? t.returnReminder.subtitlePetite : t.returnReminder.subtitleDefault

  return (
    <EmailLayout locale={locale}>
      <Heading>{subtitle}</Heading>
      <Paragraph>{t.common.hello(firstName)}</Paragraph>
      <Paragraph>{t.returnReminder.intro(`${bagBrand} ${bagName}`, returnByDate)}</Paragraph>
      <BagCard brand={bagBrand} name={bagName} imageUrl={bagImageUrl} />
      <Paragraph>{t.returnReminder.body}</Paragraph>
      <InfoBox accent="warning">
        <strong>{t.returnReminder.returnByLabel}:</strong> {returnByDate}
        <br />
        {isPetite ? t.returnReminder.notePetite : t.returnReminder.noteDefault}
      </InfoBox>
      <CtaButton label={t.returnReminder.cta} url={dashboardUrl} />
    </EmailLayout>
  )
}
