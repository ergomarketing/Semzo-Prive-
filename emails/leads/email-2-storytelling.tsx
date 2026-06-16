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
  ctaWrap: { margin: "32px 0 0 0" },
  cta: { backgroundColor: "#1a1a4b", color: "#ffffff", fontSize: "12px", letterSpacing: "0.15em", padding: "14px 28px", borderRadius: "2px", textDecoration: "none", display: "inline-block" },
}

export function Email2Storytelling({ name, trackingPixelUrl, ctaUrl, unsubscribeUrl }: Props) {
  return (
    <EmailBase
      previewText="Detrás de cada bolso hay una decisión de la que nunca te arrepentirás."
      trackingPixelUrl={trackingPixelUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>Hay piezas que no se compran. Se adoptan.</Text>
      <Text style={styles.p}>
        Un Chanel Classic Flap negro no es solo un bolso. Es la decisión más sólida que puedes tomar en moda: una pieza que lleva décadas sin perder valor, que reconocen en cualquier ciudad del mundo, que combina con absolutamente todo.
      </Text>
      <Text style={styles.p}>
        En SEMZO Privé tenemos uno ahora mismo.
      </Text>
      <Text style={styles.p}>
        También un Dior Lady Dior negro. Un Loewe Gate marrón. Un Louis Vuitton Pont-Neuf. Una selección que cambia, que rota, que no se repite.
      </Text>
      <Text style={styles.p}>
        Eso es lo que hace única a una curaduría: cuando una pieza se va, no vuelve.
      </Text>
      <Text style={styles.p}>
        Y hay suscriptoras que ya lo saben.
      </Text>

      <div style={styles.ctaWrap}>
        <Link href={ctaUrl} style={styles.cta}>
          VER LAS PIEZAS DISPONIBLES
        </Link>
      </div>
    </EmailBase>
  )
}

export default Email2Storytelling
