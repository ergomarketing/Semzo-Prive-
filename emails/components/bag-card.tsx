import { Img, Section, Text } from "@react-email/components"
import { BRAND } from "../layout"

interface BagCardProps {
  brand: string
  name: string
  imageUrl?: string | null
}

const FALLBACK_IMAGE = "https://semzoprive.com/placeholder-bag.png"

/**
 * Tarjeta reutilizable para mostrar un bolso dentro de un email
 * (bolso en posesión, bolso completado, recordatorio de devolución, etc.).
 * Usa `image_url` de la tabla `bags`, con imagen de respaldo si no hay foto.
 */
export function BagCard({ brand, name, imageUrl }: BagCardProps) {
  return (
    <Section
      style={{
        background: BRAND.cream,
        border: `1px solid ${BRAND.border}`,
        borderRadius: 4,
        padding: 16,
        margin: "20px 0",
      }}
    >
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
        <tr>
          <td style={{ width: 84, verticalAlign: "top" }}>
            <Img
              src={imageUrl || FALLBACK_IMAGE}
              width={72}
              height={72}
              alt={`${brand} ${name}`}
              style={{ borderRadius: 4, objectFit: "cover", border: `1px solid ${BRAND.border}` }}
            />
          </td>
          <td style={{ verticalAlign: "middle", paddingLeft: 16 }}>
            <Text
              style={{
                margin: 0,
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: BRAND.muted,
              }}
            >
              {brand}
            </Text>
            <Text
              style={{
                margin: "2px 0 0 0",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 18,
                color: BRAND.navy,
              }}
            >
              {name}
            </Text>
          </td>
        </tr>
      </table>
    </Section>
  )
}
