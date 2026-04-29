import { ImageResponse } from "next/og"
import { createClient } from "@supabase/supabase-js"

// Open Graph image dinamica por producto. Next.js la genera al vuelo
// y la devuelve cuando un crawler/usuario comparte la URL en redes sociales.
// Tamano estandar OG: 1200x630.

export const runtime = "edge"
export const alt = "Bolso de lujo en Semzo Prive"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function OGImage({ params }: { params: { id: string } }) {
  const { id } = params

  let bag: {
    brand: string
    name: string
    color: string | null
    price: number | null
    image_url: string | null
    images: string[] | null
    membership_type: string | null
  } | null = null

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const isUuid = UUID_REGEX.test(id)
      const { data } = isUuid
        ? await supabase
            .from("bags")
            .select("brand, name, color, price, image_url, images, membership_type")
            .eq("id", id)
            .single()
        : await supabase
            .from("bags")
            .select("brand, name, color, price, image_url, images, membership_type")
            .eq("slug", id)
            .single()
      bag = data
    } catch {
      bag = null
    }
  }

  // Fallback si no encontramos el bolso: OG generica de Semzo Prive
  const brand = bag?.brand || "Semzo Prive"
  const name = bag?.name || "Bolsos de Lujo"
  const color = bag?.color && bag.color !== "Clasico" ? bag.color : ""
  const price =
    bag?.price ||
    (bag?.membership_type === "prive" ? 279 : bag?.membership_type === "signature" ? 149 : 59)
  const bagImage = bag?.images?.[0] || bag?.image_url || null

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #faf8f5 0%, #f0ebe4 100%)",
        fontFamily: "serif",
      }}
    >
      {/* Imagen del bolso */}
      <div
        style={{
          width: "55%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        {bagImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bagImage}
            alt={`${brand} ${name}`}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e8dfd1",
              borderRadius: "16px",
              fontSize: "32px",
              color: "#7a6850",
            }}
          >
            Semzo Prive
          </div>
        )}
      </div>

      {/* Info del bolso */}
      <div
        style={{
          width: "45%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 60px 60px 20px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "24px",
              color: "#7a6850",
              letterSpacing: "8px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            Semzo Prive
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "#1a1a2e",
              marginBottom: "12px",
              fontWeight: 400,
            }}
          >
            {brand}
          </div>
          <div
            style={{
              fontSize: "56px",
              color: "#1a1a2e",
              lineHeight: 1.1,
              marginBottom: "12px",
              fontWeight: 600,
            }}
          >
            {name}
          </div>
          {color && (
            <div
              style={{
                fontSize: "28px",
                color: "#5a5a6e",
                marginTop: "8px",
              }}
            >
              {color}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "20px",
              color: "#7a6850",
              marginBottom: "8px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Alquila desde
          </div>
          <div
            style={{
              fontSize: "72px",
              color: "#1a1a2e",
              fontWeight: 700,
            }}
          >
            {price}€
            <span style={{ fontSize: "32px", fontWeight: 400, color: "#5a5a6e" }}>/mes</span>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  )
}
