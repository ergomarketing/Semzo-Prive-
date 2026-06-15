import { Link, Text, Section } from "@react-email/components"
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
  benefitBox: { backgroundColor: "#ffffff", borderLeft: "3px solid #f4c4cc", padding: "14px 18px", marginBottom: "12px", borderRadius: "0 4px 4px 0" },
  benefitTitle: { color: "#1a1a4b", fontSize: "14px", fontWeight: "700", margin: "0 0 4px 0" },
  benefitDesc: { color: "#555555", fontSize: "14px", margin: "0", lineHeight: "1.5" },
  ctaWrap: { margin: "32px 0 0 0" },
  cta: { backgroundColor: "#1a1a4b", color: "#ffffff", fontSize: "12px", letterSpacing: "0.15em", padding: "14px 28px", borderRadius: "2px", textDecoration: "none", display: "inline-block" },
}

const benefits = [
  { title: "Acceso anticipado", desc: "Ves las piezas antes que nadie" },
  { title: "Curaduría personal", desc: "Autenticidad verificada, condición documentada" },
  { title: "Precios imposibles", desc: "Prada, Gucci, Fendi, Loewe a fracción del precio nuevo" },
  { title: "Comunidad privada", desc: "Mujeres que entienden que menos y mejor es más" },
]

export function Email3PropuestaValor({ name, trackingPixelUrl, ctaUrl, unsubscribeUrl }: Props) {
  return (
    <EmailBase
      previewText="No es una tienda más. Es acceso anticipado a lo que los demás no verán."
      trackingPixelUrl={trackingPixelUrl}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text style={styles.heading}>
        ¿Qué incluye realmente una suscripción SEMZO?
      </Text>
      <Text style={styles.p}>
        No es una tienda más. Es acceso anticipado a lo que los demás no verán.
      </Text>

      {benefits.map((b, i) => (
        <div key={i} style={styles.benefitBox}>
          <Text style={styles.benefitTitle}>✦ {b.title}</Text>
          <Text style={styles.benefitDesc}>{b.desc}</Text>
        </div>
      ))}

      <div style={styles.ctaWrap}>
        <Link href={ctaUrl} style={styles.cta}>
          ACTIVAR MI ACCESO
        </Link>
      </div>
    </EmailBase>
  )
}

export default Email3PropuestaValor
