"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, Download, Upload, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/panel/page-header"
import { Button } from "@/components/ui/button"
import { TRYON_SCENES, DEFAULT_HEIGHT_CM, type TryOnScene } from "@/lib/virtual-tryon"

interface TryOnBag {
  id: string
  brand: string
  name: string
  image_url: string
  dims: { width: number; height: number; depth: number | null }
}

const MAX_SIDE = 1400
const COST_PER_IMAGE_EUR = 0.06

/** Reduce la foto en el navegador: el servidor admite hasta ~4 MB y las fotos de movil pesan mas. */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo preparar la foto"))), "image/jpeg", 0.88),
  )
}

export default function ProbadorPage() {
  const [bags, setBags] = useState<TryOnBag[]>([])
  const [hidden, setHidden] = useState(0)
  const [loadingBags, setLoadingBags] = useState(true)
  const [selfie, setSelfie] = useState<Blob | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [bagId, setBagId] = useState<string | null>(null)
  const [scene, setScene] = useState<TryOnScene>("paris")
  const [height, setHeight] = useState(String(DEFAULT_HEIGHT_CM))
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [sizeInfo, setSizeInfo] = useState<{ errorPct: number | null; attempts: number; ok: boolean } | null>(null)
  const [count, setCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/admin/tryon/bags")
      .then((r) => r.json())
      .then((d) => {
        setBags(d.bags ?? [])
        setHidden(d.hidden ?? 0)
      })
      .catch(() => setError("No se pudieron cargar los bolsos"))
      .finally(() => setLoadingBags(false))
  }, [])

  useEffect(() => () => { if (selfieUrl) URL.revokeObjectURL(selfieUrl) }, [selfieUrl])

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const blob = await downscale(file)
      setSelfie(blob)
      setSelfieUrl(URL.createObjectURL(blob))
    } catch {
      setError("No se pudo leer esa foto. Prueba con un JPG o PNG.")
    }
  }, [])

  const selectedBag = bags.find((b) => b.id === bagId) ?? null
  const ready = !!selfie && !!bagId && !generating

  const generate = async () => {
    if (!selfie || !bagId) return
    setGenerating(true)
    setError(null)
    setResult(null)
    setSizeInfo(null)
    try {
      const form = new FormData()
      form.append("selfie", selfie, "selfie.jpg")
      form.append("bag_id", bagId)
      form.append("scene", scene)
      form.append("height_cm", height)
      const res = await fetch("/api/admin/tryon", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "No se pudo generar la imagen")
      setResult(data.image)
      setSizeInfo(data.size ?? null)
      setCount((c) => c + (data.size?.attempts ?? 1))
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar la imagen")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Prueba interna"
        title="Probador virtual"
        subtitle="Sube una foto, elige un bolso disponible y una escena. La foto no se guarda."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-lg font-serif text-indigo-dark">1. Foto de la persona</h3>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-4 rounded-xl border border-dashed border-[#b08d57] bg-white p-4 text-left hover:bg-[#fff0f3]"
            >
              {selfieUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selfieUrl} alt="Foto elegida" className="h-28 w-20 rounded-lg object-cover" />
              ) : (
                <Upload className="h-6 w-6 text-[#b08d57]" />
              )}
              <span className="text-sm text-slate-600">
                {selfieUrl ? "Cambiar foto" : "Elegir foto (mejor de cuerpo entero, de frente y con buena luz)"}
              </span>
            </button>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
              Altura de la persona (cm)
              <input
                type="number"
                min={140}
                max={200}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-24 rounded-md border border-slate-300 px-2 py-1"
              />
            </label>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-serif text-indigo-dark">2. Escena</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TRYON_SCENES) as TryOnScene[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScene(key)}
                  className={`rounded-full border px-4 py-1.5 text-sm ${
                    scene === key ? "border-indigo-dark bg-indigo-dark text-white" : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {TRYON_SCENES[key].label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <section>
          <h3 className="mb-3 text-lg font-serif text-indigo-dark">3. Bolso disponible</h3>
          {loadingBags ? (
            <p className="text-sm text-slate-500">Cargando bolsos…</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {bags.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBagId(b.id)}
                    className={`rounded-lg border p-1.5 text-left ${
                      bagId === b.id ? "border-indigo-dark ring-2 ring-indigo-dark" : "border-slate-200"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.image_url} alt={`${b.brand} ${b.name}`} className="aspect-square w-full rounded object-contain bg-white" />
                    <span className="mt-1 block text-[11px] leading-tight text-slate-700">
                      {b.brand} {b.name}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {b.dims.width}×{b.dims.height}{b.dims.depth ? `×${b.dims.depth}` : ""} cm
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Solo se muestran los bolsos con estado «disponible» y medidas en su descripción
                {hidden > 0 ? ` (${hidden} disponible${hidden === 1 ? "" : "s"} sin medidas legibles no aparece${hidden === 1 ? "" : "n"})` : ""}.
              </p>
            </>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button onClick={generate} disabled={!ready} className="bg-indigo-dark text-white">
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {generating ? "Generando y midiendo el tamaño… (hasta 1 minuto)" : "Generar imagen"}
        </Button>
        {!ready && !generating && (
          <span className="text-sm text-amber-700">
            Falta elegir: {[!selfie && "la foto (paso 1)", !bagId && "un bolso (paso 3)"].filter(Boolean).join(" y ")}
          </span>
        )}
        {selectedBag && (
          <span className="text-sm text-slate-600">
            {selectedBag.brand} {selectedBag.name} · {TRYON_SCENES[scene].label}
          </span>
        )}
        {count > 0 && (
          <span className="text-xs text-slate-400">
            {count} imagen{count === 1 ? "" : "es"} en esta sesión · ≈ {(count * COST_PER_IMAGE_EUR).toFixed(2)} €
          </span>
        )}
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt="Resultado del probador virtual" className="max-h-[80vh] rounded-xl border border-slate-200" />
          {sizeInfo && (
            <p className={`mt-2 text-sm ${sizeInfo.ok ? "text-emerald-700" : "text-amber-700"}`}>
              {sizeInfo.errorPct === null
                ? "Tamaño no verificado (no se pudo medir en esta imagen)."
                : `Tamaño medido: ${sizeInfo.errorPct > 0 ? "+" : ""}${sizeInfo.errorPct} % respecto al real${sizeInfo.ok ? "" : " (fuera de tolerancia: conviene repetir)"}.`}
              {sizeInfo.attempts > 1 ? ` Se corrigió automáticamente (${sizeInfo.attempts} intentos).` : ""}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">Imagen ilustrativa: el tamaño y los detalles del bolso son aproximados.</p>
          <a href={result} download="probador-semzo.png" className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-dark underline">
            <Download className="h-4 w-4" /> Descargar
          </a>
        </div>
      )}
    </div>
  )
}
