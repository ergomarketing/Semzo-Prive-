import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import type { Locale } from "./messages"
import { getMessages } from "./messages"

export const BRAND = {
  navy: "#1a1a4b",
  gold: "#c6a15b",
  goldSoft: "#e9dcc0",
  ink: "#2b2b2b",
  muted: "#6b6b6b",
  cream: "#f5f2ec",
  card: "#ffffff",
  border: "#e7e1d6",
} as const

interface EmailLayoutProps {
  children: React.ReactNode
  preview?: string
  eyebrow?: string
  locale?: Locale
  /** Si se pasa, el pie de página incluye un enlace de baja (emails de marketing). */
  unsubscribeUrl?: string
}

/**
 * Layout compartido de todos los emails de Semzo Privé.
 * Incluye cabecera de marca, filete dorado, franja de eyebrow opcional,
 * pie de página con dirección/soporte/baja, y soporte de modo oscuro vía
 * `@media (prefers-color-scheme: dark)`.
 */
export function EmailLayout({ children, preview, eyebrow, locale = "es", unsubscribeUrl }: EmailLayoutProps) {
  const t = getMessages(locale)
  const year = new Date().getFullYear()

  return (
    <Html lang={locale}>
      <Head>
        <meta name="color-scheme" content="light dark" />
        <style>{`
          @media (prefers-color-scheme: dark) {
            .semzo-body { background: #0f0f1a !important; }
            .semzo-card { background: #17172b !important; border-color: #2a2a45 !important; }
            .semzo-text { color: #e6e2da !important; }
            .semzo-muted { color: #9a97ab !important; }
          }
          @media (max-width: 600px) {
            .semzo-card { width: 100% !important; }
            .semzo-content { padding: 28px 20px !important; }
          }
        `}</style>
      </Head>
      {preview ? <Preview>{preview}</Preview> : null}
      <Body className="semzo-body" style={{ margin: 0, padding: 0, background: BRAND.cream }}>
        <Container
          className="semzo-card"
          style={{
            maxWidth: 600,
            width: "100%",
            background: BRAND.card,
            border: `1px solid ${BRAND.border}`,
            margin: "32px auto",
          }}
        >
          <Section style={{ background: BRAND.navy, padding: "36px 24px", textAlign: "center" }}>
            <Text
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 26,
                letterSpacing: 6,
                color: "#ffffff",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              {t.common.brand}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: BRAND.goldSoft,
                margin: "8px 0 0 0",
              }}
            >
              {t.common.tagline}
            </Text>
          </Section>

          <div style={{ height: 3, background: BRAND.gold, fontSize: 0, lineHeight: "3px" }}>&nbsp;</div>

          <Section className="semzo-content" style={{ padding: "40px 40px 8px 40px" }}>
            {eyebrow ? (
              <Text
                className="semzo-muted"
                style={{
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: 11,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  color: BRAND.gold,
                  margin: "0 0 12px 0",
                }}
              >
                {eyebrow}
              </Text>
            ) : null}
            <div className="semzo-text" style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 15, lineHeight: 1.7, color: BRAND.ink }}>
              {children}
            </div>
          </Section>

          <Section style={{ padding: "0 40px" }}>
            <Hr style={{ borderColor: BRAND.border, margin: "32px 0 0 0" }} />
          </Section>

          <Section style={{ padding: "28px 40px 36px 40px", textAlign: "center" }}>
            <Text
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 15,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: BRAND.navy,
                margin: 0,
              }}
            >
              {t.common.brand}
            </Text>
            <Text className="semzo-muted" style={{ margin: "10px 0 0 0", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, lineHeight: 1.6, color: BRAND.muted }}>
              {t.common.address}
              <br />
              <Link href={`mailto:${t.common.supportEmail}`} style={{ color: BRAND.muted, textDecoration: "underline" }}>
                {t.common.supportEmail}
              </Link>
              {" · "}
              <Link href={t.common.site} style={{ color: BRAND.muted, textDecoration: "underline" }}>
                semzoprive.com
              </Link>
              {unsubscribeUrl ? (
                <>
                  {" · "}
                  <Link href={unsubscribeUrl} style={{ color: BRAND.muted, textDecoration: "underline" }}>
                    {t.common.unsubscribe}
                  </Link>
                </>
              ) : null}
            </Text>
            <Text className="semzo-muted" style={{ margin: "14px 0 0 0", fontFamily: "Helvetica, Arial, sans-serif", fontSize: 11, color: BRAND.muted }}>
              © {year} {t.common.brand}. {t.common.rightsReserved}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
