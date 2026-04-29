import { ImageResponse } from "next/og"

// Open Graph image dinamica por producto.
// VERSION DIAGNOSTICA: solo texto, sin fetch a BD ni imagen externa.
// Si esta version renderiza OK, el problema estaba en fetchBag o en
// la imagen remota. Si sigue en blanco, hay un problema mas profundo
// con ImageResponse en este deploy.

export const runtime = "edge"
export const alt = "Semzo Prive - Alquiler de bolsos de lujo"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Convertir slug en titulo legible: "chanel-classic-flap" -> "Chanel Classic Flap"
  const title = id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #faf8f5 0%, #f0ebe4 100%)",
        fontFamily: "serif",
        padding: "80px",
      }}
    >
      <div
        style={{
          fontSize: "32px",
          color: "#7a6850",
          letterSpacing: "12px",
          textTransform: "uppercase",
          marginBottom: "40px",
        }}
      >
        Semzo Prive
      </div>
      <div
        style={{
          fontSize: "80px",
          color: "#1a1a2e",
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: "40px",
          fontWeight: 600,
          maxWidth: "1000px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "36px",
          color: "#5a5a6e",
          textAlign: "center",
        }}
      >
        Alquiler de bolsos de lujo
      </div>
    </div>,
    { ...size },
  )
}
