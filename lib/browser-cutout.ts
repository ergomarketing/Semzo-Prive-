/**
 * Quita el fondo de una foto dentro del navegador, sin servicios de pago.
 *
 * Usa ISNet "general use" (Apache-2.0, uso comercial permitido) cuantizado (46 MB) con onnxruntime-web (MIT).
 * El modelo se descarga una vez y queda guardado en la cache del navegador. Cada foto tarda unos 10-15 s.
 */

const ORT_VERSION = "1.20.1"
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`
const MODEL_URL = "https://huggingface.co/Ko033/isnet-general-use-onnx/resolve/main/onnx/model_quantized.onnx"
const CACHE_NAME = "semzo-cutout-v1"
const MODEL_SIDE = 1024

/** Mensaje de error cuando el modelo no consigue separar el bolso del fondo. */
export const NO_FOREGROUND = "NO_FOREGROUND"

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ort = any
type Session = any

// import() por URL que el empaquetador no toca (la libreria viene del CDN, no del paquete)
const importFromUrl = new Function("url", "return import(url)") as (url: string) => Promise<Ort>

let sessionPromise: Promise<{ ort: Ort; session: Session }> | null = null

async function fetchModel(): Promise<ArrayBuffer> {
  // La cache puede no estar disponible (ventana privada): entonces se descarga cada vez
  let cache: Cache | null = null
  try {
    cache = await caches.open(CACHE_NAME)
  } catch {
    cache = null
  }
  const hit = cache ? await cache.match(MODEL_URL).catch(() => undefined) : undefined
  if (hit) return hit.arrayBuffer()
  const res = await fetch(MODEL_URL)
  if (!res.ok) throw new Error(`No se pudo descargar el modelo (${res.status})`)
  if (cache) await cache.put(MODEL_URL, res.clone()).catch(() => {})
  return res.arrayBuffer()
}

function loadSession(onStage?: (text: string) => void) {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      onStage?.("Descargando el modelo de recorte (solo la primera vez)…")
      const [ort, model] = await Promise.all([importFromUrl(`${ORT_BASE}ort.wasm.min.mjs`), fetchModel()])
      ort.env.wasm.wasmPaths = ORT_BASE
      ort.env.wasm.numThreads = 1
      onStage?.("Preparando el recorte…")
      const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] })
      return { ort, session }
    })().catch((e) => {
      sessionPromise = null // permite reintentar
      throw e
    })
  }
  return sessionPromise
}

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo leer la foto"))
    }
    img.src = url
  })
}

/**
 * Quita las manchas sueltas del fondo: se queda solo con las zonas conectadas grandes (el bolso, y asas o correas
 * si quedan separadas) y un margen de unos pixeles alrededor para no cortar el borde suave.
 */
function keepMainObjects(alpha: Float32Array, S: number): Uint8Array {
  const label = new Int32Array(S * S) // 0 = sin visitar
  const sizes: number[] = [0]
  const stack = new Int32Array(S * S)
  for (let start = 0; start < S * S; start++) {
    if (alpha[start] <= 0.5 || label[start] !== 0) continue
    const id = sizes.length
    let size = 0
    let top = 0
    stack[top++] = start
    label[start] = id
    while (top > 0) {
      const p = stack[--top]
      size++
      const x = p % S
      const y = (p - x) / S
      if (x > 0 && alpha[p - 1] > 0.5 && label[p - 1] === 0) { label[p - 1] = id; stack[top++] = p - 1 }
      if (x < S - 1 && alpha[p + 1] > 0.5 && label[p + 1] === 0) { label[p + 1] = id; stack[top++] = p + 1 }
      if (y > 0 && alpha[p - S] > 0.5 && label[p - S] === 0) { label[p - S] = id; stack[top++] = p - S }
      if (y < S - 1 && alpha[p + S] > 0.5 && label[p + S] === 0) { label[p + S] = id; stack[top++] = p + S }
    }
    sizes.push(size)
  }
  const largest = sizes.reduce((a, b) => (b > a ? b : a), 0)
  const core = new Uint8Array(S * S)
  for (let i = 0; i < S * S; i++) {
    if (label[i] !== 0 && sizes[label[i]] >= largest * 0.04) core[i] = 1
  }
  // Se ensancha 8 px (maximo en horizontal y luego en vertical) para conservar el borde suave
  const R = 8
  const horiz = new Uint8Array(S * S)
  for (let y = 0; y < S; y++) {
    let last = -Infinity
    for (let x = 0; x < S; x++) {
      if (core[y * S + x]) last = x
      if (x - last <= R) horiz[y * S + x] = 1
    }
    last = Infinity
    for (let x = S - 1; x >= 0; x--) {
      if (core[y * S + x]) last = x
      if (last - x <= R) horiz[y * S + x] = 1
    }
  }
  const keep = new Uint8Array(S * S)
  for (let x = 0; x < S; x++) {
    let last = -Infinity
    for (let y = 0; y < S; y++) {
      if (horiz[y * S + x]) last = y
      if (y - last <= R) keep[y * S + x] = 1
    }
    last = Infinity
    for (let y = S - 1; y >= 0; y--) {
      if (horiz[y * S + x]) last = y
      if (last - y <= R) keep[y * S + x] = 1
    }
  }
  return keep
}

/** Devuelve un PNG con el bolso y el fondo transparente. */
export async function cutoutInBrowser(file: Blob, onStage?: (text: string) => void): Promise<Blob> {
  const { ort, session } = await loadSession(onStage)
  onStage?.("Recortando el bolso…")

  const img = await loadImage(file)
  const W = img.naturalWidth
  const H = img.naturalHeight
  const S = MODEL_SIDE

  // Entrada del modelo: 1024x1024, valores 0-1 menos 0,5
  const small = document.createElement("canvas")
  small.width = S
  small.height = S
  const sctx = small.getContext("2d", { willReadFrequently: true })
  if (!sctx) throw new Error("Canvas error")
  sctx.drawImage(img, 0, 0, S, S)
  const px = sctx.getImageData(0, 0, S, S).data
  const input = new Float32Array(3 * S * S)
  for (let i = 0; i < S * S; i++) {
    input[i] = px[i * 4] / 255 - 0.5
    input[S * S + i] = px[i * 4 + 1] / 255 - 0.5
    input[2 * S * S + i] = px[i * 4 + 2] / 255 - 0.5
  }

  const out = await session.run({ input_image: new ort.Tensor("float32", input, [1, 3, S, S]) })
  const mask: Float32Array = out[session.outputNames[0]].data

  // Mascara: se normaliza a 0-1 y se endurece un poco para que el borde no quede gris
  let min = Infinity
  let max = -Infinity
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] < min) min = mask[i]
    if (mask[i] > max) max = mask[i]
  }
  const span = max - min || 1
  const maskCanvas = document.createElement("canvas")
  maskCanvas.width = S
  maskCanvas.height = S
  const mctx = maskCanvas.getContext("2d")
  if (!mctx) throw new Error("Canvas error")
  const maskData = mctx.createImageData(S, S)
  const alpha = new Float32Array(S * S)
  let covered = 0
  for (let i = 0; i < S * S; i++) {
    const v = (mask[i] - min) / span
    const t = Math.min(1, Math.max(0, (v - 0.12) / 0.76))
    alpha[i] = t * t * (3 - 2 * t) // smoothstep
    if (alpha[i] > 0.5) covered++
  }
  // Casi nada o casi todo recortado: el bolso no se ha separado del fondo
  if (covered < S * S * 0.02 || covered > S * S * 0.95) throw new Error(NO_FOREGROUND)

  const keep = keepMainObjects(alpha, S)
  for (let i = 0; i < S * S; i++) {
    maskData.data[i * 4] = 255
    maskData.data[i * 4 + 1] = 255
    maskData.data[i * 4 + 2] = 255
    maskData.data[i * 4 + 3] = keep[i] ? Math.round(alpha[i] * 255) : 0
  }
  mctx.putImageData(maskData, 0, 0)

  // Foto original (a su tamano) con la mascara como transparencia
  const result = document.createElement("canvas")
  result.width = W
  result.height = H
  const rctx = result.getContext("2d")
  if (!rctx) throw new Error("Canvas error")
  rctx.drawImage(img, 0, 0)
  rctx.globalCompositeOperation = "destination-in"
  rctx.imageSmoothingQuality = "high"
  rctx.drawImage(maskCanvas, 0, 0, W, H)

  return new Promise((resolve, reject) => {
    result.toBlob((b) => (b ? resolve(b) : reject(new Error("Error al generar el recorte"))), "image/png")
  })
}
