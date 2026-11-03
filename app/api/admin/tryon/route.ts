import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import {
  TRYON_SCENES,
  clampHeightCm,
  generateTryOnImage,
  parseBagDimensions,
  type TryOnScene,
} from "@/lib/virtual-tryon"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MAX_SELFIE_BYTES = 4 * 1024 * 1024 // Vercel limita el cuerpo de la peticion a ~4,5 MB
const MAX_BAG_PHOTOS = 3
const SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp"]

/**
 * POST /api/admin/tryon  (multipart/form-data)
 *   selfie     File    — foto de la persona (jpeg/png/webp, hasta 4 MB). No se guarda en ningun sitio.
 *   bag_id     string  — id de un bolso con estado "available"
 *   scene      string  — paris | mykonos | milan
 *   height_cm  string  — (opcional) altura de la persona, para calibrar el tamano del bolso
 * Responde { image: "data:image/png;base64,..." }
 */
export async function POST(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  try {
    const form = await request.formData()
    const selfie = form.get("selfie")
    const bagId = String(form.get("bag_id") ?? "")
    const scene = String(form.get("scene") ?? "") as TryOnScene

    if (!(selfie instanceof File) || selfie.size === 0) {
      return NextResponse.json({ error: "Falta la foto" }, { status: 400 })
    }
    if (!SELFIE_TYPES.includes(selfie.type)) {
      return NextResponse.json({ error: "La foto debe ser JPG, PNG o WebP" }, { status: 400 })
    }
    if (selfie.size > MAX_SELFIE_BYTES) {
      return NextResponse.json({ error: "La foto pesa demasiado (máximo 4 MB)" }, { status: 400 })
    }
    if (!bagId) return NextResponse.json({ error: "Falta elegir un bolso" }, { status: 400 })
    if (!(scene in TRYON_SCENES)) return NextResponse.json({ error: "Escena no válida" }, { status: 400 })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: bag, error: bagError } = await supabase
      .from("bags")
      .select("id, status, description, image_url, images")
      .eq("id", bagId)
      .maybeSingle()
    if (bagError) return NextResponse.json({ error: "No se pudo leer el bolso" }, { status: 500 })
    if (!bag || bag.status !== "available") {
      return NextResponse.json({ error: "Ese bolso no está disponible ahora mismo" }, { status: 409 })
    }
    const dims = parseBagDimensions(bag.description)
    if (!dims || !bag.image_url) {
      return NextResponse.json({ error: "Ese bolso no tiene medidas en su descripción" }, { status: 422 })
    }

    // Hasta 3 fotos del mismo bolso (la principal primero): con mas angulos el modelo copia mejor el herraje y el color.
    const photoUrls = [bag.image_url, ...(Array.isArray(bag.images) ? bag.images : [])]
      .filter((u, i, all): u is string => typeof u === "string" && all.indexOf(u) === i)
      .slice(0, MAX_BAG_PHOTOS)
    const bagImages = (
      await Promise.all(
        photoUrls.map(async (u) => {
          try {
            const r = await fetch(u.startsWith("http") ? u : new URL(u, request.url).toString())
            if (!r.ok) return null
            const mime = (r.headers.get("content-type") || "image/jpeg").split(";")[0]
            if (!mime.startsWith("image/")) return null
            return { mimeType: mime, base64: Buffer.from(await r.arrayBuffer()).toString("base64") }
          } catch {
            return null
          }
        }),
      )
    ).filter((x): x is { mimeType: string; base64: string } => x !== null)
    if (bagImages.length === 0) return NextResponse.json({ error: "No se pudo leer la foto del bolso" }, { status: 502 })

    const image = await generateTryOnImage({
      person: { mimeType: selfie.type, base64: Buffer.from(await selfie.arrayBuffer()).toString("base64") },
      bags: bagImages,
      dims,
      scene,
      personHeightCm: clampHeightCm(form.get("height_cm")),
    })
    return NextResponse.json({ image: `data:${image.mimeType};base64,${image.base64}` })
  } catch (error) {
    console.error("[tryon] error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar la imagen" },
      { status: 500 },
    )
  }
}
