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
  highlight: { color: "#1a1a4b", fontSize: "15px", lineHeight: "1.7", margin: "0 0 16px 0", fontWeight: "600" },
  ctaWrap: { margin: "32px 0 0 0" },
  cta: { backgroundColor: "#1a1a4b", color: "#ffffff", fontSize: "12px", letterSpacing: "0.15em", padding: "14px 28px", borderRadius: "2px", textDecoration: "none", display: "inline-block" },
}

export function Email4Escasez({ trackingPixelUrl, ctaUrl, unsubscribeUrl }: Props) {
  return (
    <EmailBase
      previewText="La escasez no es un recurso de marketing. Es la naturaleza del lujo."
      trackingPixelUrl={trackingPixelUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>Prendas como estas no esperan.</Text>
      <Text style={styles.p}>
        Hay algo que no te dije antes: las piezas de SEMZO Privé no son reposables.
      </Text>
      <Text style={styles.p}>
        Cuando un Fendi 3Baguette cereza sale, no hay otro. Cuando aparece un Saint Laurent College verde, las que tienen acceso lo ven primero.
      </Text>
      <Text style={styles.p}>
        Esta semana han entrado piezas nuevas a la colección.
      </Text>
      <Text style={styles.highlight}>
        Las miembros con suscripción activa ya las han visto.
      </Text>
      <Text style={styles.p}>
        Tú todavía puedes verlas. Pero solo si das el paso hoy.
      </Text>

      <div style={styles.ctaWrap}>
        <Link href={ctaUrl} style={styles.cta}>
          VER LAS PIEZAS Y ACTIVAR MI ACCESO
        </Link>
      </div>
    </EmailBase>
  )
}

export default Email4Escasez
