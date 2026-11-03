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

export function buildTryOnPrompt(
  dims: BagDimensions,
  scene: TryOnScene,
  personHeightCm: number,
  bagPhotos = 1,
  correction = "",
): string {
  const depthText = dims.depth ? ` and ${dims.depth} cm deep` : ""
  // Una proporcion geometrica ("X % de su altura") la sigue mejor el modelo que unas medidas sueltas en cm.
  const widthPct = Math.round((dims.width / personHeightCm) * 100)
  const heightPct = Math.round((dims.height / personHeightCm) * 100)
  const size =
    `SIZE IS CRITICAL. The real bag measures exactly ${dims.width} cm wide, ${dims.height} cm tall${depthText}; ` +
    `the woman is ${personHeightCm} cm tall. Full-body shot: show her entirely from head to shoes. ` +
    `In the image, the width of the bag body (excluding handles and straps) must be exactly ${widthPct}% of her full body height ` +
    `(top of head to soles) and its height ${heightPct}% of her body height. ` +
    "A bag this size is " +
    (dims.width <= 16 ? "tiny: smaller than her hand spread open" : dims.width <= 24 ? "small: a bit wider than her hand" : dims.width <= 30 ? "medium: about as wide as her forearm is long" : "large") +
    ". Do not enlarge or shrink it, and do not make it look bigger by holding it close to the camera. "
  const bagRef =
    bagPhotos > 1
      ? `Images 2 to ${bagPhotos + 1} are product photos of ONE single luxury handbag from different angles. `
      : "Image 2 is a luxury handbag product photo. "

  return (
    "Image 1 is a photo of a real woman. " +
    bagRef +
    "Create a realistic, editorial fashion photograph of the SAME woman from image 1 (keep her face, hair, skin tone and body exactly), " +
    `carrying that EXACT handbag ${TRYON_SCENES[scene].prompt}. ` +
    size +
    "BAG FIDELITY IS THE TOP PRIORITY: copy the bag exactly as in the product photos, like a catalogue reproduction. " +
    "Keep its exact color and shade (do not wash out or lighten it), its exact material texture and stitching, " +
    "the exact shape of the body, flap and handles or straps, and the exact metal hardware, lock or logo design and its position. " +
    "Do not simplify, restyle or invent details. Lighting must be soft and even so the bag's true colors are preserved. " +
    "She wears the same outfit as in image 1, and any other bag or clutch she holds in image 1 is replaced by this handbag. " +
    "Natural pose, photorealistic, no text, no watermark." +
    correction
  )
}

export type InlineImage = { mimeType: string; base64: string }

const MODEL = process.env.TRYON_MODEL || "gemini-3.1-flash-image"
const RETRIES = 1

type GeminiPart = { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }

/** Llama al modelo de imagen. Lanza Error con un mensaje legible si falla. */
export async function generateTryOnImage(params: {
  person: InlineImage
  bags: InlineImage[]
  dims: BagDimensions
  scene: TryOnScene
  personHeightCm: number
  correction?: string
}): Promise<InlineImage> {
  // Se limpian espacios, saltos de linea y comillas: es un fallo frecuente al pegar la clave en Vercel.
  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']+|["']+$/g, "").trim()
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en el servidor")

  const body = {
    contents: [
      {
        parts: [
          { text: buildTryOnPrompt(params.dims, params.scene, params.personHeightCm, params.bags.length, params.correction) },
          { inline_data: { mime_type: params.person.mimeType, data: params.person.base64 } },
          ...params.bags.map((b) => ({ inline_data: { mime_type: b.mimeType, data: b.base64 } })),
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

// ─── Verificacion del tamano ─────────────────────────────────────────────────
// El modelo de imagen estima el tamano "a ojo" y suele agrandar el bolso. Despues de generar, un modelo de vision
// mide el ancho del cuerpo del bolso frente a la altura de la persona; si se desvia mas de la tolerancia, se repite.

const VISION_MODEL = process.env.TRYON_VISION_MODEL || "gemini-3.5-flash"
const SIZE_TOLERANCE = 0.12
const MAX_ATTEMPTS = 3

/** Ancho y alto en pixeles de un PNG o JPEG (el modelo puede devolver cualquiera de los dos). */
function imageSize(base64: string): { w: number; h: number } | null {
  const buf = Buffer.from(base64, "base64")
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  return null
}

/**
 * Error relativo del tamano del bolso: +0.2 = sale un 20 % mas grande de lo real, -0.1 = un 10 % mas pequeno.
 * null si no se puede medir (pies cortados, respuesta rara...): en ese caso no se afirma nada.
 */
export async function measureSizeError(image: InlineImage, widthCm: number, personHeightCm: number): Promise<number | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/^["']+|["']+$/g, "").trim()
  const size = imageSize(image.base64)
  if (!apiKey || !size) return null
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Look at this photo of a woman holding a handbag. Return ONLY JSON with these keys, each a bounding box " +
                  "[ymin,xmin,ymax,xmax] normalized 0-1000: \"person\": the whole woman from the top of her head to the soles of her shoes; " +
                  "\"bag_body\": ONLY the main body of the handbag, EXCLUDING handles, straps and chains. " +
                  "Also \"feet_visible\": true or false (are her shoes fully visible).",
              },
              { inline_data: { mime_type: image.mimeType, data: image.base64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const o = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text ?? "null")
    if (!o || o.feet_visible === false || !Array.isArray(o.person) || !Array.isArray(o.bag_body)) return null
    const personPx = ((o.person[2] - o.person[0]) / 1000) * size.h
    const bagPx = ((o.bag_body[3] - o.bag_body[1]) / 1000) * size.w
    if (!(personPx > 0) || !(bagPx > 0)) return null
    const expected = widthCm / personHeightCm
    return bagPx / personPx / expected - 1
  } catch {
    return null
  }
}

export type VerifiedTryOn = {
  image: InlineImage
  /** Error de tamano medido (+0.2 = 20 % mas grande). null = no se pudo medir. */
  sizeError: number | null
  attempts: number
  withinTolerance: boolean
}

/** Genera y mide; repite (hasta 3 intentos) con una correccion explicita si el bolso sale fuera de tamano. */
export async function generateVerifiedTryOn(params: {
  person: InlineImage
  bags: InlineImage[]
  dims: BagDimensions
  scene: TryOnScene
  personHeightCm: number
}): Promise<VerifiedTryOn> {
  let best: VerifiedTryOn | null = null
  let correction = ""
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const image = await generateTryOnImage({ ...params, correction })
    const sizeError = await measureSizeError(image, params.dims.width, params.personHeightCm)
    const within = sizeError === null ? false : Math.abs(sizeError) <= SIZE_TOLERANCE
    const current: VerifiedTryOn = { image, sizeError, attempts: attempt, withinTolerance: within }
    if (!best || (sizeError !== null && (best.sizeError === null || Math.abs(sizeError) < Math.abs(best.sizeError)))) best = current
    // Sin medida no hay nada que corregir: se devuelve tal cual, marcada como no verificada.
    if (sizeError === null || within) return { ...best, attempts: attempt }
    const pct = Math.round(Math.abs(sizeError) * 100)
    correction =
      ` CORRECTION: in the previous attempt the bag looked about ${pct}% too ${sizeError > 0 ? "big" : "small"}. ` +
      `Draw it ${pct}% ${sizeError > 0 ? "smaller" : "larger"} than before, relative to her body.`
  }
  return { ...best!, attempts: MAX_ATTEMPTS }
}
