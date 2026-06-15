import { Button, Link, Text } from "@react-email/components"
import * as React from "react"
import { EmailBase } from "./email-base"

interface Props {
  name: string
  trackingPixelUrl: string
  ctaUrl: string
  unsubscribeUrl: string
}

const styles = {
  greeting: { color: "#1a1a4b", fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: "700", margin: "0 0 24px 0", lineHeight: "1.3" },
  p: { color: "#1a1a4b", fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px 0" },
  signature: { color: "#1a1a4b", fontSize: "15px", lineHeight: "1.7", margin: "24px 0 0 0", fontStyle: "italic" },
  ctaWrap: { margin: "32px 0 0 0" },
  cta: { backgroundColor: "#1a1a4b", color: "#ffffff", fontSize: "12px", letterSpacing: "0.15em", padding: "14px 28px", borderRadius: "2px", textDecoration: "none", display: "inline-block" },
}

export function Email1Bienvenida({ name, trackingPixelUrl, ctaUrl, unsubscribeUrl }: Props) {
  return (
    <EmailBase
      previewText="El lujo no se lleva. Se elige con criterio."
      trackingPixelUrl={trackingPixelUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.greeting}>
        Bienvenida a algo diferente{name ? `, ${name}` : ""}.
      </Text>

      <Text style={styles.p}>
        Acabas de entrar en algo que muy poca gente conoce.
      </Text>
      <Text style={styles.p}>
        SEMZO Privé no es una tienda. Es una selección.
      </Text>
      <Text style={styles.p}>
        Cada pieza ha sido elegida a mano: bolsos de firmas como Chanel, Dior, Loewe, Louis Vuitton o Prada, en condición impecable, con historia y con una relación precio-valor que el mercado convencional no puede ofrecer.
      </Text>
      <Text style={styles.p}>
        No porque el lujo sea inalcanzable. Sino porque ahora hay una forma más inteligente de acceder a él.
      </Text>
      <Text style={styles.p}>
        En los próximos días te voy a mostrar cómo funciona este mundo desde dentro.
      </Text>
      <Text style={styles.p}>
        Con calma. Sin urgencia artificial.
      </Text>
      <Text style={styles.signature}>Bienvenida.</Text>

      <div style={styles.ctaWrap}>
        <Link href={ctaUrl} style={styles.cta}>
          EXPLORAR LA COLECCIÓN
        </Link>
      </div>
    </EmailBase>
  )
}

export default Email1Bienvenida
