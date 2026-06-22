import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta REMOVE_BG_API_KEY en las variables de entorno." },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se recibió ninguna imagen" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 })
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "La imagen no puede superar 12MB" }, { status: 400 })
    }

    const removeBgForm = new FormData()
    removeBgForm.append("image_file", file)
    removeBgForm.append("size", "auto")

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: removeBgForm,
    })

    if (!res.ok) {
      let detail = ""
      try {
        const err = await res.json()
        detail = err?.errors?.[0]?.title || err?.errors?.[0]?.detail || ""
      } catch {
        // respuesta sin JSON
      }

      let message: string
      switch (res.status) {
        case 402:
          message = "Sin créditos en Remove.bg. Recarga tu cuenta o usa otra API key."
          break
        case 403:
        case 401:
          message = "API key de Remove.bg inválida o no autorizada. Revisa REMOVE_BG_API_KEY."
          break
        case 400:
          message = detail ? `Imagen rechazada: ${detail}` : "Imagen no válida para Remove.bg."
          break
        case 429:
          message = "Demasiadas peticiones a Remove.bg. Espera unos segundos e intenta de nuevo."
          break
        default:
          message = detail || `Error ${res.status} de Remove.bg`
      }

      console.error(`[v0] remove-bg fallo (${res.status}): ${detail || "sin detalle"}`)
      return NextResponse.json({ error: message }, { status: res.status })
    }

    const arrayBuffer = await res.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[v0] remove-bg error:", error)
    return NextResponse.json({ error: "Error al procesar la imagen" }, { status: 500 })
  }
}
