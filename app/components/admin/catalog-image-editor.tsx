"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Upload, Loader2, Check, X, Download, Trash2, CloudUpload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SIZE = 1000

type OutFormat = "jpeg" | "png" | "webp"

interface EditedImage {
  id: string
  originalName: string
  previewUrl: string // URL del original o del resultado
  resultUrl: string | null // dataURL final con fondo
  resultBlob: Blob | null
  fileName: string
  status: "processing" | "done" | "error"
  error?: string
  uploadedUrl?: string // URL en blob tras subir a la librería
  uploading?: boolean
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "")
}

export default function CatalogImageEditor() {
  const [bgColor, setBgColor] = useState("#f0efed")
  const [outFormat, setOutFormat] = useState<OutFormat>("webp")
  const [images, setImages] = useState<EditedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateImage = (id: string, patch: Partial<EditedImage>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)))
  }

  const applyBackground = (pngBlob: Blob, fmt: OutFormat, color: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(pngBlob)
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error("No se pudo crear el canvas"))
          return
        }
        ctx.fillStyle = color
        ctx.fillRect(0, 0, SIZE, SIZE)
        const pad = SIZE * 0.08
        const avail = SIZE - pad * 2
        const ratio = Math.min(avail / img.width, avail / img.height)
        const w = img.width * ratio
        const h = img.height * ratio
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Error al generar la imagen"))),
          `image/${fmt}`,
          0.92,
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Error al cargar la imagen recortada"))
      }
      img.src = url
    })
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
          fileName: `${baseName(file.name)}_cat.${ext}`,
          status: "processing",
        },
      ])

      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch("/api/admin/catalog-editor/remove-bg", {
          method: "POST",
          body: form,
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Error ${res.status}`)
        }
        const cutoutBlob = await res.blob()
        const finalBlob = await applyBackground(cutoutBlob, outFormat, bgColor)
        const finalUrl = URL.createObjectURL(finalBlob)
        updateImage(id, {
          resultUrl: finalUrl,
          resultBlob: finalBlob,
          previewUrl: finalUrl,
          status: "done",
        })
      } catch (e) {
        updateImage(id, {
          status: "error",
          error: e instanceof Error ? e.message : "Error desconocido",
        })
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
    const ready = images.filter((i) => i.resultUrl)
    ready.forEach((img, i) => {
      setTimeout(() => downloadOne(img), i * 300)
    })
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
                aria-label="Código de color de fondo"
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
              1000 × 1000 px (cuadrado)
            </div>
          </div>
        </div>
      </div>

      {/* Zona de subida */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles([...e.dataTransfer.files])
        }}
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
          onChange={(e) => {
            handleFiles([...(e.target.files || [])])
            e.target.value = ""
          }}
        />
      </div>

      {/* Progreso */}
      {progress && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            {progress.done} de {progress.total} procesadas
          </p>
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
              <Button size="sm" onClick={downloadAll} disabled={readyCount === 0} className="bg-[#1a1a4b] text-white hover:bg-[#2a2a6b]">
                <Download className="mr-2 h-4 w-4" />
                Descargar todas
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="relative aspect-square" style={{ background: bgColor }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl || "/placeholder.svg"} alt={img.originalName} className="h-full w-full object-contain" />
                  {img.status === "processing" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
                      <span className="text-xs text-slate-600">Procesando…</span>
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
                  {img.uploadedUrl && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#1a1a4b] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      En librería
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-2.5">
                  <p
                    className="truncate text-[11px] text-slate-500"
                    title={img.status === "error" ? img.error : img.fileName}
                  >
                    {img.status === "error" ? img.error : img.fileName}
                  </p>
                  {img.status === "done" && (
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
                        disabled={img.uploading || !!img.uploadedUrl}
                      >
                        {img.uploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <CloudUpload className="mr-1 h-3.5 w-3.5" />
                            {img.uploadedUrl ? "Subida" : "Subir"}
                          </>
                        )}
                      </Button>
                    </div>
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
