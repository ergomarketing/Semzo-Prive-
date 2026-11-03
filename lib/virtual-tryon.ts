/**
 * Probador virtual: genera una imagen de una persona con un bolso del catalogo en una escena aspiracional.
 * Solo servidor. Usa la API de Gemini (modelo de imagen) con la clave GEMINI_API_KEY.
 *
 * El tamano del bolso es lo mas delicado: se le dan al modelo las medidas reales del catalogo y una referencia
 * de escala con el cuerpo de la persona, porque sin ellas el bolso sale demasiado grande o pequeno.
 */

export const TRYON_SCENES = {
  paris: {
    label: "París",
    prompt: "walking on an elegant Parisian street with Haussmann buildings, soft golden morning light",
  },
  mykonos: {
    label: "Mykonos",
    prompt: "in Mykonos, whitewashed alleys with bougainvillea and blue doors, warm sunset light",
  },
  milan: {
    label: "Milán",
    prompt: "outside a chic cafe in Milan, stylish city atmosphere, natural daylight",
  },
} as const

export type TryOnScene = keyof typeof TRYON_SCENES

export const DEFAULT_HEIGHT_CM = 170
const MIN_HEIGHT_CM = 140
const MAX_HEIGHT_CM = 200

export type BagDimensions = { width: number; height: number; depth: number | null }

/**
 * Las medidas del catalogo viven en la descripcion ("Dimensiones: 25,5 x 15,5 x 6,5 cm"), no en la columna
 * `dimensions`, que esta vacia. Orden: ancho x alto x fondo (el fondo puede faltar).
 */
export function parseBagDimensions(description: string | null | undefined): BagDimensions | null {
  if (!description) return null
  const match = description.match(
    /dimensiones[^0-9]*([0-9][0-9.,]*)\s*[x×]\s*([0-9][0-9.,]*)(?:\s*[x×]\s*([0-9][0-9.,]*))?/i,
  )
  if (!match) return null
  const num = (s: string) => Number.parseFloat(s.replace(",", "."))
  const width = num(match[1])
  const height = num(match[2])
  const depth = match[3] ? num(match[3]) : null
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  return { width, height, depth: depth && Number.isFinite(depth) ? depth : null }
}

export function clampHeightCm(value: unknown): number {
  const n = typeof value === "string" || typeof value === "number" ? Number(value) : NaN
  if (!Number.isFinite(n)) return DEFAULT_HEIGHT_CM
  return Math.min(MAX_HEIGHT_CM, Math.max(MIN_HEIGHT_CM, Math.round(n)))
}

export function buildTryOnPrompt(dims: BagDimensions, scene: TryOnScene, personHeightCm: number): string {
  const k = personHeightCm / DEFAULT_HEIGHT_CM
  const handCm = Math.round(18 * k)
  const hipsCm = Math.round(36 * k)
  const depthText = dims.depth ? ` and ${dims.depth} cm deep` : ""
  const size =
    `SIZE IS CRITICAL. The real bag measures exactly ${dims.width} cm wide, ${dims.height} cm tall${depthText}. ` +
    `The woman is about ${personHeightCm} cm tall (her hand is about ${handCm} cm long, her hips about ${hipsCm} cm wide), ` +
    `so the bag must be drawn about ${(dims.width / handCm).toFixed(1)} hand-lengths wide and ` +
    `${Math.round((dims.width / hipsCm) * 100)}% of her hip width, scaled correctly to her body. Do not enlarge or shrink it. `

  return (
    "Image 1 is a photo of a real woman. Image 2 is a luxury handbag product photo. " +
    "Create a realistic, editorial fashion photograph of the SAME woman from image 1 (keep her face, hair, skin tone and body exactly), " +
    `carrying the EXACT handbag from image 2 ${TRYON_SCENES[scene].prompt}. ` +
    size +
    "Reproduce the bag faithfully: same shape, color, material, hardware, logo and proportions. " +
    "She wears the same outfit as in image 1, and any other bag or clutch she holds in image 1 is replaced by this handbag. " +
    "Natural pose, photorealistic, no text, no watermark."
  )
}

export type InlineImage = { mimeType: string; base64: string }

const MODEL = process.env.TRYON_MODEL || "gemini-3.1-flash-image"
const RETRIES = 1

type GeminiPart = { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }

/** Llama al modelo de imagen. Lanza Error con un mensaje legible si falla. */
export async function generateTryOnImage(params: {
  person: InlineImage
  bag: InlineImage
  dims: BagDimensions
  scene: TryOnScene
  personHeightCm: number
}): Promise<InlineImage> {
  // Se limpian espacios, saltos de linea y comillas: es un fallo frecuente al pegar la clave en Vercel.
  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']+|["']+$/g, "").trim()
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en el servidor")

  const body = {
    contents: [
      {
        parts: [
          { text: buildTryOnPrompt(params.dims, params.scene, params.personHeightCm) },
          { inline_data: { mime_type: params.person.mimeType, data: params.person.base64 } },
          { inline_data: { mime_type: params.bag.mimeType, data: params.bag.base64 } },
        ],
      },
    ],
  }

  let lastError = "Error desconocido"
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))

    if (res.ok) {
      const parts: GeminiPart[] = json.candidates?.[0]?.content?.parts ?? []
      for (const p of parts) {
        const inline = p.inlineData ?? p.inline_data
        const data = inline?.data
        if (data) {
          const mime = (p.inlineData?.mimeType ?? p.inline_data?.mime_type) || "image/png"
          return { mimeType: mime, base64: data }
        }
      }
      const reason = json.candidates?.[0]?.finishReason ?? json.promptFeedback?.blockReason
      throw new Error(`El modelo no devolvió imagen${reason ? ` (${reason})` : ""}. Prueba con otra foto.`)
    }

    lastError = `${res.status}: ${String(json.error?.message ?? "").slice(0, 200)}`
    if (res.status === 400 && /api key/i.test(lastError)) {
      // Solo el largo y el prefijo estandar ("AIza"), nunca la clave: ayuda a ver si Vercel la recibe bien.
      lastError += ` · la clave que recibe el servidor tiene ${apiKey.length} caracteres y empieza por "${apiKey.slice(0, 4)}" (una clave de Google tiene 39 y empieza por "AIza")`
    }
    // 503/429 suelen ser puntuales: un reintento corto antes de rendirse.
    if ((res.status === 503 || res.status === 429) && attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, 2500))
      continue
    }
    break
  }
  throw new Error(`No se pudo generar la imagen (${lastError})`)
}
