"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, Loader2, Check, X, Download, Trash2, CloudUpload, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cutoutInBrowser, NO_FOREGROUND } from "@/lib/browser-cutout"

const SIZE = 1200

type OutFormat = "jpeg" | "png" | "webp"
type ImgStatus = "processing" | "done" | "error"

interface Bag {
  id: string
  name: string
  brand: string
  image_url: string | null
}

interface EditedImage {
  id: string
  originalName: string
  previewUrl: string
  resultUrl: string | null
  resultBlob: Blob | null
  cutoutBlob?: Blob
  angle: number
  scale: number
  fileName: string
  status: ImgStatus
  error?: string
  notice?: string
  stage?: string
  uploadedUrl?: string
  uploading?: boolean
  assigning?: boolean
  assignedBagId?: string
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "")
}

const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024
const MAX_UPLOAD_SIDE = 2400

/**
 * Las fotos del movil pesan 5-10 MB y Vercel rechaza peticiones de mas de 4,5 MB (error 413).
 * Se reducen aqui, en el navegador, antes de enviarlas a recortar: 2400 px de lado largo sobran
 * para una imagen final de 1200 px. Si algo falla se envia la original.
 */
async function shrinkForUpload(file: File): Promise<File> {
  // Se carga con un <img> (no con createImageBitmap): Safari no admite todas sus opciones y el <img>
  // aplica solo la orientacion EXIF de las fotos del movil.
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("No se pudo leer la foto"))
      el.src = url
    })
    const longSide = Math.max(img.naturalWidth, img.naturalHeight)
    if (file.size <= MAX_UPLOAD_BYTES && longSide <= MAX_UPLOAD_SIDE) return file
    const ratio = Math.min(1, MAX_UPLOAD_SIDE / longSide)
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.naturalWidth * ratio)
    canvas.height = Math.round(img.naturalHeight * ratio)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.92, 0.85, 0.75, 0.6]) {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
      if (blob && blob.size <= MAX_UPLOAD_BYTES) {
        return new File([blob], `${baseName(file.name)}.jpg`, { type: "image/jpeg" })
      }
    }
    return file
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function CatalogImageEditor() {
  const [bgColor, setBgColor] = useState("#f0efed")
  const [outFormat, setOutFormat] = useState<OutFormat>("webp")
  const [images, setImages] = useState<EditedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [bags, setBags] = useState<Bag[]>([])
  const [bagsLoading, setBagsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar lista de bolsos al montar
  useEffect(() => {
    setBagsLoading(true)
    fetch("/api/admin/catalog-editor/bags")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        const raw: Bag[] = Array.isArray(data) ? data : (data.bags ?? [])
        setBags(raw)
      })
      .catch(() => {})
      .finally(() => setBagsLoading(false))
  }, [])

  const updateImage = (id: string, patch: Partial<EditedImage>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)))
  }

  // Detecta el bounding box real de píxeles no-transparentes en el canvas
  const getBoundingBox = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const pixels = ctx.getImageData(0, 0, w, h).data
    let minX = w, minY = h, maxX = 0, maxY = 0
    let filled = 0 // pixeles realmente ocupados por el bolso (sin contar el aire de la caja)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = pixels[(y * w + x) * 4 + 3]
        if (alpha > 128) filled++
        if (alpha > 10) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX < minX) return { x: 0, y: 0, w, h, filled: w * h } // fallback imagen sin transparencia
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, filled: Math.max(filled, 1) }
  }

  const applyBackground = (
    pngBlob: Blob,
    fmt: OutFormat,
    color: string,
    opts: { angle: number; scale: number } = { angle: 0, scale: 1 },
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(pngBlob)
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        // 1. Enderezar: se gira el recorte en un lienzo mas grande para no cortar nada
        const rad = (opts.angle * Math.PI) / 180
        const cos = Math.abs(Math.cos(rad))
        const sin = Math.abs(Math.sin(rad))
        const rw = Math.ceil(img.width * cos + img.height * sin)
        const rh = Math.ceil(img.width * sin + img.height * cos)
        const tmp = document.createElement("canvas")
        tmp.width = rw
        tmp.height = rh
        const tmpCtx = tmp.getContext("2d", { willReadFrequently: true })
        if (!tmpCtx) { URL.revokeObjectURL(url); reject(new Error("Canvas error")); return }
        tmpCtx.translate(rw / 2, rh / 2)
        tmpCtx.rotate(rad)
        tmpCtx.drawImage(img, -img.width / 2, -img.height / 2)

        // 2. Limpiar el halo: los pixeles casi transparentes del borde del recorte se eliminan
        const data = tmpCtx.getImageData(0, 0, rw, rh)
        for (let i = 3; i < data.data.length; i += 4) {
          if (data.data[i] < 24) data.data[i] = 0
        }
        tmpCtx.putImageData(data, 0, 0)

        // 3. Caja real del bolso
        const bb = getBoundingBox(tmpCtx, rw, rh)

        // 4. Lienzo final: fondo liso con un centro algo mas claro (como un estudio), igual en todas las fotos
        const canvas = document.createElement("canvas")
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext("2d")
        if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Canvas error")); return }
        ctx.fillStyle = color
        ctx.fillRect(0, 0, SIZE, SIZE)
        const light = ctx.createRadialGradient(SIZE / 2, SIZE * 0.45, 0, SIZE / 2, SIZE * 0.45, SIZE * 0.65)
        light.addColorStop(0, "rgba(255,255,255,0.40)")
        light.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = light
        ctx.fillRect(0, 0, SIZE, SIZE)

        // 5. Encuadre igual para todos: el bolso ocupa la misma superficie visual (no el mismo ancho o alto),
        //    asi una pochette ancha y un bolso alto se ven del mismo tamano, y una cadena larga colgando no lo
        //    encoge. Se mide la superficie real del bolso, no su caja. Ningun lado pasa del 86% del lienzo.
        //    El control de tamano afina sobre esa base.
        const TARGET_FILLED = SIZE * SIZE * 0.33
        const maxSide = SIZE * 0.86
        const byArea = Math.sqrt(TARGET_FILLED / bb.filled)
        const byFit = Math.min(maxSide / bb.w, maxSide / bb.h)
        const ratio = Math.min(Math.min(byArea, byFit) * opts.scale, (SIZE * 0.96) / bb.w, (SIZE * 0.96) / bb.h)
        const dw = bb.w * ratio
        const dh = bb.h * ratio
        const dx = (SIZE - dw) / 2
        const dy = (SIZE - dh) / 2 - SIZE * 0.01

        // 6. Sombra de apoyo bajo el bolso (elipse difusa) para que no flote
        ctx.save()
        ctx.translate(SIZE / 2, dy + dh - dh * 0.012)
        ctx.scale(1, 0.1)
        const radius = dw * 0.42
        const ground = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
        ground.addColorStop(0, "rgba(26,26,75,0.30)")
        ground.addColorStop(1, "rgba(26,26,75,0)")
        ctx.fillStyle = ground
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // 7. El bolso, con una sombra suave de contorno
        ctx.shadowColor = "rgba(26,26,75,0.16)"
        ctx.shadowBlur = SIZE * 0.022
        ctx.shadowOffsetY = SIZE * 0.009
        ctx.drawImage(tmp, bb.x, bb.y, bb.w, bb.h, dx, dy, dw, dh)
        ctx.shadowColor = "transparent"

        URL.revokeObjectURL(url)
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Error al generar la imagen"))),
          `image/${fmt}`,
          0.94,
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Error al cargar la imagen recortada"))
      }
      img.src = url
    })
  }

  // Reencuadra una foto ya recortada (enderezar / tamano) sin volver a llamar a Remove.bg
  const rerenderTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const adjustImage = (img: EditedImage, patch: { angle?: number; scale?: number }) => {
    const angle = patch.angle ?? img.angle
    const scale = patch.scale ?? img.scale
    updateImage(img.id, { angle, scale })
    const cutout = img.cutoutBlob
    if (!cutout) return
    clearTimeout(rerenderTimers.current[img.id])
    rerenderTimers.current[img.id] = setTimeout(async () => {
      try {
        const blob = await applyBackground(cutout, outFormat, bgColor, { angle, scale })
        const url = URL.createObjectURL(blob)
        updateImage(img.id, { resultUrl: url, resultBlob: blob, previewUrl: url })
      } catch {
        // se queda con la version anterior
      }
    }, 180)
  }

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))
    if (!imageFiles.length) return

    setProgress({ done: 0, total: imageFiles.length })
    let done = 0

    for (const file of imageFiles) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const previewUrl = URL.createObjectURL(file)
      const ext = outFormat === "jpeg" ? "jpg" : outFormat
      setImages((prev) => [
        ...prev,
        {
          id,
          originalName: file.name,
          previewUrl,
          resultUrl: null,
          resultBlob: null,
          angle: 0,
          scale: 1,
          fileName: `${baseName(file.name)}_cat.${ext}`,
          status: "processing",
        },
      ])

      try {
        const source = await shrinkForUpload(file)
        let cutoutBlob: Blob
        let notice: string | undefined
        try {
          cutoutBlob = await cutoutInBrowser(source, (stage) => updateImage(id, { stage }))
        } catch (e) {
          if (!(e instanceof Error) || e.message !== NO_FOREGROUND) throw e
          // Sin recorte posible: se encuadra la foto original sobre el fondo
          cutoutBlob = source
          notice = "Sin recorte: no se detectó el bolso, se usó la foto original"
        }
        const finalBlob = await applyBackground(cutoutBlob, outFormat, bgColor)
        const finalUrl = URL.createObjectURL(finalBlob)
        updateImage(id, {
          resultUrl: finalUrl,
          resultBlob: finalBlob,
          cutoutBlob,
          previewUrl: finalUrl,
          status: "done",
          stage: undefined,
          notice,
        })
      } catch (e) {
        updateImage(id, { status: "error", error: e instanceof Error ? e.message : "Error desconocido" })
      }

      done++
      setProgress({ done, total: imageFiles.length })
    }

    setTimeout(() => setProgress(null), 2000)
  }

  const downloadOne = (img: EditedImage) => {
    if (!img.resultUrl) return
    const a = document.createElement("a")
    a.href = img.resultUrl
    a.download = img.fileName
    a.click()
  }

  const downloadAll = () => {
    images.filter((i) => i.resultUrl).forEach((img, i) => setTimeout(() => downloadOne(img), i * 300))
  }

  const uploadToLibrary = async (img: EditedImage) => {
    if (!img.resultBlob) return
    updateImage(img.id, { uploading: true })
    try {
      const form = new FormData()
      form.append("file", new File([img.resultBlob], img.fileName, { type: img.resultBlob.type }))
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Error al subir")
      }
      const data = await res.json()
      updateImage(img.id, { uploadedUrl: data.url, uploading: false })
    } catch (e) {
      updateImage(img.id, {
        uploading: false,
        error: e instanceof Error ? e.message : "Error al subir",
      })
    }
  }

  const assignToBag = async (img: EditedImage, bagId: string) => {
    if (!img.uploadedUrl || !bagId) return
    updateImage(img.id, { assigning: true })
    try {
      const res = await fetch(`/api/admin/inventory/${bagId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: img.uploadedUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Error al asignar")
      }
      updateImage(img.id, { assigning: false, assignedBagId: bagId })
      // Actualizar lista local de bolsos para reflejar la nueva imagen
      setBags((prev) => prev.map((b) => (b.id === bagId ? { ...b, image_url: img.uploadedUrl! } : b)))
    } catch (e) {
      updateImage(img.id, {
        assigning: false,
        error: e instanceof Error ? e.message : "Error al asignar",
      })
    }
  }

  const clearAll = () => setImages([])
  const readyCount = images.filter((i) => i.status === "done").length

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Ajustes de salida</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bg-color" className="text-xs uppercase tracking-wide text-slate-500">
              Color de fondo
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="bg-color"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-md border border-slate-200 bg-transparent p-1"
                aria-label="Seleccionar color de fondo"
              />
              <Input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="font-mono text-sm"
                aria-label="Código hex de fondo"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="out-format" className="text-xs uppercase tracking-wide text-slate-500">
              Formato
            </Label>
            <select
              id="out-format"
              value={outFormat}
              onChange={(e) => setOutFormat(e.target.value as OutFormat)}
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
            >
              <option value="webp">WebP (recomendado)</option>
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs uppercase tracking-wide text-slate-500">Tamaño final</Label>
            <div className="flex h-11 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              1200 × 1200 px (cuadrado)
            </div>
          </div>
        </div>
      </div>

      {/* Zona de subida */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles([...e.dataTransfer.files]) }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-6 py-12 text-center transition-colors ${
          isDragging ? "border-slate-900 bg-slate-50" : "border-slate-300 hover:border-slate-900 hover:bg-slate-50"
        }`}
      >
        <Upload className="mb-3 h-9 w-9 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Toca aquí o arrastra fotos para procesar</p>
        <p className="mt-1 text-xs text-slate-400">JPG · PNG · WebP · Varias a la vez</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles([...(e.target.files || [])]); e.target.value = "" }}
        />
      </div>

      {/* Progreso */}
      {progress && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{progress.done} de {progress.total} procesadas</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Resultados */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Fotos procesadas ({readyCount}/{images.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
              <Button
                size="sm"
                onClick={downloadAll}
                disabled={readyCount === 0}
                className="bg-[#1a1a4b] text-white hover:bg-[#2a2a6b]"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar todas
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {/* Imagen */}
                <div className="relative aspect-square" style={{ background: bgColor }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl || "/placeholder.svg"} alt={img.originalName} className="h-full w-full object-contain" />
                  {img.status === "processing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
                      <span className="px-3 text-center text-xs text-slate-600">{img.stage || "Procesando…"}</span>
                    </div>
                  )}
                  {img.status === "done" && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      <Check className="h-3 w-3" /> Listo
                    </span>
                  )}
                  {img.status === "error" && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      <X className="h-3 w-3" /> Error
                    </span>
                  )}
                  {img.assignedBagId && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[#1a1a4b] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      <Link2 className="h-3 w-3" /> Asignada
                    </span>
                  )}
                  {img.uploadedUrl && !img.assignedBagId && (
                    <span className="absolute left-2 top-2 rounded-full bg-sky-700 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      En librería
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="space-y-2.5 p-3">
                  <p className="truncate text-[11px] text-slate-500" title={img.status === "error" ? img.error : img.fileName}>
                    {img.status === "error" ? (
                      <span className="text-red-600">{img.error}</span>
                    ) : (
                      img.fileName
                    )}
                  </p>
                  {img.notice && <p className="text-[11px] text-amber-700">{img.notice}</p>}

                  {img.status === "done" && (
                    <>
                      {/* Ajustes de encuadre: se aplican al momento, sin gastar otro recorte */}
                      {!img.uploadedUrl && (
                        <div className="space-y-1.5 rounded-md bg-slate-50 px-3 py-2">
                          <label className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span className="w-16 shrink-0">Enderezar</span>
                            <input
                              type="range"
                              min={-15}
                              max={15}
                              step={0.5}
                              value={img.angle}
                              onChange={(e) => adjustImage(img, { angle: Number(e.target.value) })}
                              className="h-1 flex-1 accent-[#1a1a4b]"
                            />
                            <span className="w-9 text-right tabular-nums">{img.angle}°</span>
                          </label>
                          <label className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span className="w-16 shrink-0">Tamaño</span>
                            <input
                              type="range"
                              min={0.6}
                              max={1.1}
                              step={0.02}
                              value={img.scale}
                              onChange={(e) => adjustImage(img, { scale: Number(e.target.value) })}
                              className="h-1 flex-1 accent-[#1a1a4b]"
                            />
                            <span className="w-9 text-right tabular-nums">{Math.round(img.scale * 100)}%</span>
                          </label>
                        </div>
                      )}

                      {/* Botones subir / descargar */}
                      {!img.uploadedUrl && (
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex-1 px-2 text-[11px]"
                            onClick={() => downloadOne(img)}
                          >
                            <Download className="mr-1 h-3.5 w-3.5" />
                            Bajar
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 flex-1 bg-[#1a1a4b] px-2 text-[11px] text-white hover:bg-[#2a2a6b]"
                            onClick={() => uploadToLibrary(img)}
                            disabled={img.uploading}
                          >
                            {img.uploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <CloudUpload className="mr-1 h-3.5 w-3.5" />
                                Subir a librería
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Asignar a bolso — aparece una vez subida a la librería */}
                      {img.uploadedUrl && !img.assignedBagId && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium text-slate-600">Asignar a un bolso del catálogo:</p>
                          <div className="flex gap-1.5">
                            <select
                              className="h-8 flex-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] outline-none focus:border-slate-900 disabled:opacity-50"
                              defaultValue=""
                              id={`bag-select-${img.id}`}
                              disabled={bagsLoading || img.assigning}
                            >
                              <option value="" disabled>
                                {bagsLoading ? "Cargando bolsos…" : "Selecciona un bolso"}
                              </option>
                              {bags.map((bag) => (
                                <option key={bag.id} value={bag.id}>
                                  {bag.brand} — {bag.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              className="h-8 bg-[#1a1a4b] px-3 text-[11px] text-white hover:bg-[#2a2a6b]"
                              disabled={img.assigning}
                              onClick={() => {
                                const sel = document.getElementById(`bag-select-${img.id}`) as HTMLSelectElement
                                if (sel?.value) assignToBag(img, sel.value)
                              }}
                            >
                              {img.assigning ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Link2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Confirmación de asignación */}
                      {img.assignedBagId && (
                        <div className="rounded-md bg-green-50 px-3 py-2 text-[11px] text-green-800">
                          <Check className="mr-1 inline h-3.5 w-3.5" />
                          Foto asignada a{" "}
                          <strong>
                            {bags.find((b) => b.id === img.assignedBagId)?.brand} —{" "}
                            {bags.find((b) => b.id === img.assignedBagId)?.name}
                          </strong>
                        </div>
                      )}

                      {/* Descargar siempre disponible */}
                      {img.uploadedUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-full px-2 text-[11px]"
                          onClick={() => downloadOne(img)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Descargar también
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
