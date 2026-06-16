import { Link, Text } from "@react-email/components"
import * as React from "react"
import { EmailBase } from "./email-base"

interface Props {
  name: string
  trackingPixelUrl: string
  ctaUrl: string
  unsubscribeUrl: string
}

const styles = {
  heading: { color: "#1a1a4b", fontSize: "22px", fontFamily: "Georgia, serif", fontWeight: "700", margin: "0 0 24px 0", lineHeight: "1.3" },
  p: { color: "#1a1a4b", fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px 0" },
  closing: { color: "#888888", fontSize: "14px", lineHeight: "1.7", margin: "24px 0 0 0", fontStyle: "italic" },
  ctaWrap: { margin: "32px 0 0 0" },
  cta: { backgroundColor: "#1a1a4b", color: "#ffffff", fontSize: "12px", letterSpacing: "0.15em", padding: "14px 28px", borderRadius: "2px", textDecoration: "none", display: "inline-block" },
}

export function Email5Cierre({ name, trackingPixelUrl, ctaUrl, unsubscribeUrl }: Props) {
  return (
    <EmailBase
      previewText="Si no es para ti, está bien. Pero si lo es, ya sabes dónde estamos."
      trackingPixelUrl={trackingPixelUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>
        Una última cosa{name ? `, ${name}` : ""}.
      </Text>
      <Text style={styles.p}>
        Esta es la última vez que te escribo sobre esto.
      </Text>
      <Text style={styles.p}>
        SEMZO Privé es un espacio para mujeres que ya han decidido que prefieren menos cosas y mejores. Que entienden que un bolso de firma bien elegido vale más que diez de temporada.
      </Text>
      <Text style={styles.p}>
        Si eso eres tú, la puerta sigue abierta.
      </Text>
      <Text style={styles.p}>
        Si no es el momento, no hay problema. Guarda este email y vuelve cuando lo sea.
      </Text>
      <Text style={styles.p}>
        Y si quieres hablar antes de decidir, responde directamente aquí.
      </Text>

      <div style={styles.ctaWrap}>
        <Link href={ctaUrl} style={styles.cta}>
          UNIRME A SEMZO PRIVÉ
        </Link>
      </div>

      <Text style={styles.closing}>
        — El equipo de SEMZO Privé
      </Text>
    </EmailBase>
  )
}

export default Email5Cierre
