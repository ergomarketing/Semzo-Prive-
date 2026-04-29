import { ImageResponse } from "next/og"

// Open Graph image dinamica por producto.
// Se genera al vuelo cuando alguien comparte la URL del bolso en redes.
// Tamano estandar OG: 1200x630.

export const runtime = "edge"
export const alt = "Semzo Prive - Alquiler de bolsos de lujo"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

type BagData = {
  id: string
  slug: string | null
  brand: string
  name: string
  color: string | null
  price: number | null
  image_url: string | null
  images: string[] | null
  membership_type: string | null
}

// Fetch directo a la REST API de Supabase. No usamos el SDK porque en
// edge introduce overhead innecesario (esto es solo una SELECT por id/slug).
async function fetchBag(idOrSlug: string): Promise<BagData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null

  // Detectar si nos llega UUID o slug. UUID tiene formato xxxx-xxxx-xxxx-xxxx-xxxx
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  const filter = isUuid ? `id=eq.${idOrSlug}` : `slug=eq.${idOrSlug}`
  const url = `${supabaseUrl}/rest/v1/bags?${filter}&select=id,slug,brand,name,color,price,image_url,images,membership_type&limit=1`

  try {
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as BagData[]
    return rows?.[0] || null
  } catch {
    return null
  }
}

// Pre-validar que la URL de imagen responde. Si satori falla al cargar
// la imagen, devuelve PNG vacio sin error. HEAD con timeout corto.
async function validateImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    const res = await fetch(url, { method: "HEAD", signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const ct = res.headers.get("content-type") || ""
    if (!ct.startsWith("image/")) return null
    return url
  } catch {
    return null
  }
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bag = await fetchBag(id)

  // Datos del bolso con fallbacks. Si no hay bolso, OG generica.
  const brand = bag?.brand || "Semzo Prive"
  const name = bag?.name || "Bolsos de Lujo"
  const color = bag?.color && bag.color !== "Clasico" ? bag.color : ""
  const price =
    bag?.price ||
    (bag?.membership_type === "prive" ? 279 : bag?.membership_type === "signature" ? 149 : 59)

  // URL imagen del bolso, validada (200 + content-type imagen).
  const rawImage = bag?.images?.[0] || bag?.image_url || null
  const validUrl = rawImage && /^https?:\/\//.test(rawImage) ? rawImage : null
  const bagImage = validUrl ? await validateImage(validUrl) : null

  // Paleta Semzo: crema (fondo), indigo profundo (texto principal),
  // dorado/champan (acentos). Coherente con el branding del sitio.
  const colors = {
    cream: "#faf8f5",
    creamDark: "#f0ebe4",
    indigo: "#1a1a2e",
    indigoSoft: "#3d3d5c",
    accent: "#a08968",
    accentLight: "#c4a878",
    white: "#ffffff",
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: colors.cream,
        fontFamily: "serif",
      }}
    >
      {/* Columna izquierda: foto del bolso o iniciales si no hay imagen */}
      <div
        style={{
          width: "50%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${colors.creamDark} 0%, ${colors.cream} 100%)`,
          position: "relative",
        }}
      >
        {bagImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bagImage}
            alt=""
            width={520}
            height={520}
            style={{
              objectFit: "contain",
              filter: "drop-shadow(0 30px 50px rgba(26, 26, 46, 0.25))",
            }}
          />
        ) : (
          <div
            style={{
              width: 380,
              height: 380,
              borderRadius: "50%",
              background: colors.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 180,
              color: colors.accent,
              fontWeight: 300,
              boxShadow: "0 30px 50px rgba(26, 26, 46, 0.15)",
            }}
          >
            {brand.charAt(0)}
          </div>
        )}
      </div>

      {/* Columna derecha: datos del bolso + branding */}
      <div
        style={{
          width: "50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 60px",
          background: colors.white,
        }}
      >
        {/* Top: marca pequena con tracking */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: colors.accent,
              letterSpacing: 8,
              textTransform: "uppercase",
              marginBottom: 24,
              fontWeight: 600,
            }}
          >
            {brand}
          </div>

          {/* Nombre del bolso (grande) */}
          <div
            style={{
              fontSize: 64,
              color: colors.indigo,
              lineHeight: 1.05,
              fontWeight: 600,
              marginBottom: color ? 16 : 0,
              maxWidth: 480,
            }}
          >
            {name}
          </div>

          {/* Color (si existe) */}
          {color ? (
            <div
              style={{
                fontSize: 32,
                color: colors.indigoSoft,
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              {color}
            </div>
          ) : null}
        </div>

        {/* Bottom: precio + branding */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderTop: `2px solid ${colors.creamDark}`,
            paddingTop: 36,
          }}
        >
          {/* Precio destacado */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: colors.indigoSoft,
                marginRight: 12,
              }}
            >
              Alquila desde
            </div>
            <div
              style={{
                fontSize: 56,
                color: colors.indigo,
                fontWeight: 700,
              }}
            >
              {price}€
            </div>
            <div
              style={{
                fontSize: 24,
                color: colors.indigoSoft,
                marginLeft: 6,
              }}
            >
              /mes
            </div>
          </div>

          {/* Branding Semzo Prive */}
          <div
            style={{
              fontSize: 20,
              color: colors.accent,
              letterSpacing: 12,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Semzo Prive
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  )
}
