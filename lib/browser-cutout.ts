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

/**
 * Fotos de estudio que ya vienen sobre fondo liso y claro: no necesitan IA. Se quita solo el fondo que toca los
 * bordes de la foto (lo de dentro del bolso, como un herraje blanco, se queda) y el resto de la foto no se toca,
 * asi conserva toda su calidad. Devuelve null si el fondo no es liso y claro (entonces hay que usar la IA).
 */
export async function cutoutFromCleanBackground(file: Blob): Promise<Blob | null> {
  const img = await loadImage(file)
  const W = img.naturalWidth
  const H = img.naturalHeight
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0)
  const frame = ctx.getImageData(0, 0, W, H)
  const px = frame.data

  // Color del fondo: mediana de los pixeles del borde
  const edge: number[] = []
  const pushEdge = (x: number, y: number) => edge.push((y * W + x) * 4)
  for (let x = 0; x < W; x++) { pushEdge(x, 0); pushEdge(x, H - 1) }
  for (let y = 1; y < H - 1; y++) { pushEdge(0, y); pushEdge(W - 1, y) }
  const median = (c: number) => {
    const v = edge.map((o) => px[o + c]).sort((a, b) => a - b)
    return v[Math.floor(v.length / 2)]
  }
  const bg = [median(0), median(1), median(2)]
  if (Math.min(bg[0], bg[1], bg[2]) < 215) return null // fondo oscuro o de color: hace falta IA

  const diffAt = (o: number) => Math.max(Math.abs(px[o] - bg[0]), Math.abs(px[o + 1] - bg[1]), Math.abs(px[o + 2] - bg[2]))
  let clean = 0
  for (const o of edge) if (diffAt(o) <= 14) clean++
  if (clean < edge.length * 0.97) return null // el borde no es liso (suelo, pared, objetos...)

  // Fondo = lo parecido al color de fondo que se alcanza desde el borde de la foto
  const HI = 30
  const LO = 6
  const isBg = new Uint8Array(W * H)
  const stack = new Int32Array(W * H)
  let top = 0
  const seed = (x: number, y: number) => {
    const p = y * W + x
    if (!isBg[p] && diffAt(p * 4) <= HI) { isBg[p] = 1; stack[top++] = p }
  }
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1) }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y) }
  while (top > 0) {
    const p = stack[--top]
    const x = p % W
    const y = (p - x) / W
    if (x > 0) seed(x - 1, y)
    if (x < W - 1) seed(x + 1, y)
    if (y > 0) seed(x, y - 1)
    if (y < H - 1) seed(x, y + 1)
  }

  // Huecos de fondo encerrados (el interior de un asa): si son grandes y del color exacto del fondo, tambien son fondo.
  // Los pequenos (el esmalte blanco de un cierre) se quedan como parte del bolso.
  // Tambien los huecos finos y largos en diagonal (la rendija entre las dos capas de una correa): ocupan poco pero
  // miden mas del 8% de la foto y no son un rectangulo. Asi no se tocan letras ni detalles blancos pequenos.
  const TIGHT = 10
  const MIN_HOLE = W * H * 0.015
  const MIN_STRIP = W * H * 0.0002
  const MIN_STRIP_LENGTH = Math.max(W, H) * 0.08
  const seen = new Uint8Array(W * H)
  const hole = new Int32Array(W * H)
  for (let start = 0; start < W * H; start++) {
    if (isBg[start] || seen[start] || diffAt(start * 4) > TIGHT) continue
    let t = 0
    let minX = W, maxX = 0, minY = H, maxY = 0
    hole[t++] = start
    seen[start] = 1
    for (let i = 0; i < t; i++) {
      const p = hole[i]
      const x = p % W
      const y = (p - x) / W
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      const visit = (q: number) => {
        if (!seen[q] && !isBg[q] && diffAt(q * 4) <= TIGHT) { seen[q] = 1; hole[t++] = q }
      }
      if (x > 0) visit(p - 1)
      if (x < W - 1) visit(p + 1)
      if (y > 0) visit(p - W)
      if (y < H - 1) visit(p + W)
    }
    const boxW = maxX - minX + 1
    const boxH = maxY - minY + 1
    const longSide = Math.max(boxW, boxH)
    const isStrip = t >= MIN_STRIP && longSide >= MIN_STRIP_LENGTH && t / (boxW * boxH) < 0.4
    if (t >= MIN_HOLE || isStrip) for (let i = 0; i < t; i++) isBg[hole[i]] = 1
  }

  // Transparencia: el fondo desaparece; su sombra suave (si la hay) queda como sombra translucida
  const alpha = new Uint8ClampedArray(W * H)
  let filled = 0
  for (let p = 0; p < W * H; p++) {
    if (isBg[p]) {
      const d = diffAt(p * 4)
      const a = Math.min(1, Math.max(0, (d - LO) / (HI - LO)))
      alpha[p] = Math.round(a * 140)
    } else {
      alpha[p] = 255
      filled++
    }
  }
  if (filled < W * H * 0.03 || filled > W * H * 0.9) return null

  // Pixel del borde del bolso que toca el fondo: medio transparente, para que no quede un halo claro
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x
      if (alpha[p] === 255 && (isBg[p - 1] || isBg[p + 1] || isBg[p - W] || isBg[p + W])) alpha[p] = 140
    }
  }

  for (let p = 0; p < W * H; p++) {
    const o = p * 4
    if (isBg[p]) {
      px[o] = 38
      px[o + 1] = 38
      px[o + 2] = 64 // la sombra se pinta en el indigo de la marca
    }
    px[o + 3] = alpha[p]
  }
  ctx.putImageData(frame, 0, 0)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"))
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
