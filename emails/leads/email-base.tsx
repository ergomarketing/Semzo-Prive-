import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components"
import * as React from "react"

export interface BaseEmailProps {
  previewText: string
  trackingPixelUrl: string
  unsubscribeUrl: string
  children: React.ReactNode
}

const styles = {
  main: { backgroundColor: "#fff0f3", fontFamily: "system-ui, -apple-system, sans-serif" },
  container: { maxWidth: "560px", margin: "0 auto" },
  header: { backgroundColor: "#1a1a4b", padding: "24px 32px" },
  headerText: { color: "#ffffff", fontSize: "18px", fontWeight: "700", letterSpacing: "0.15em", margin: "0" },
  body: { backgroundColor: "#fff0f3", padding: "40px 32px" },
  footer: { backgroundColor: "#ffffff", padding: "24px 32px", textAlign: "center" as const },
  footerText: { color: "#888888", fontSize: "12px", lineHeight: "1.6", margin: "0 0 8px 0" },
  footerLink: { color: "#1a1a4b", textDecoration: "underline", fontSize: "12px" },
  hr: { borderColor: "hsl(214.3, 31.8%, 91.4%)", margin: "0" },
}

export function EmailBase({ previewText, trackingPixelUrl, unsubscribeUrl, children }: BaseEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.headerText}>SEMZO PRIVÉ</Text>
          </Section>

          {/* Contenido variable */}
          <Section style={styles.body}>
            {children}
          </Section>

          <Hr style={styles.hr} />

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              SEMZO Privé · Marbella, España
            </Text>
            <Text style={styles.footerText}>
              Recibes este email porque te registraste en semzoprive.com
            </Text>
            <Link href={unsubscribeUrl} style={styles.footerLink}>
              Darse de baja
            </Link>
          </Section>
        </Container>

        {/* Pixel de tracking */}
        {trackingPixelUrl && (
          <Img src={trackingPixelUrl} width="1" height="1" alt="" style={{ display: "block" }} />
        )}
      </Body>
    </Html>
  )
}
