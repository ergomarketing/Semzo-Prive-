"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

type Template = {
  id: number
  name: string
  subject: string
  body_html: string
  delay_days: number
  active: boolean
  updated_at: string
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<Template | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/email-templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates || [])
        if (d.templates?.length) setSelected(d.templates[0])
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    const res = await fetch("/api/admin/email-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    })
    const data = await res.json()
    if (data.template) {
      setTemplates((prev) => prev.map((t) => (t.id === data.template.id ? data.template : t)))
      setSelected(data.template)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-400">
        Cargando plantillas...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/leads" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Plantillas de email</h1>
          <p className="text-sm text-gray-500">
            Edita el asunto y cuerpo de cada email de la secuencia automática.
            Usa{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">{"{{name}}"}</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">{"{{cta_url}}"}</code>,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">{"{{unsubscribe_url}}"}</code>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Lista de emails */}
        <div className="col-span-3">
          <div className="space-y-1">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected({ ...t })}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm transition ${
                  selected?.id === t.id
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{t.name}</div>
                <div className="mt-0.5 text-xs text-gray-400">
                  {t.delay_days === 0 ? "Inmediato" : `Día ${t.delay_days}`}
                  {!t.active && <span className="ml-2 text-red-400">Inactivo</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        {selected && (
          <div className="col-span-9 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              {/* Cabecera */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">{selected.name}</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelected({ ...selected, active: !selected.active })}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {selected.active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-red-400" />
                    )}
                    {selected.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
                  </button>
                </div>
              </div>

              {/* Delay */}
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Enviar a los (días desde el registro)
                </label>
                <input
                  type="number"
                  min={0}
                  value={selected.delay_days}
                  onChange={(e) =>
                    setSelected({ ...selected, delay_days: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Asunto */}
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Asunto del email
                </label>
                <input
                  type="text"
                  value={selected.subject}
                  onChange={(e) => setSelected({ ...selected, subject: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              {/* Cuerpo */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Cuerpo del email (HTML)
                </label>
                <textarea
                  value={selected.body_html}
                  onChange={(e) => setSelected({ ...selected, body_html: e.target.value })}
                  rows={18}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                Preview (con variables de ejemplo)
              </h3>
              <div
                className="rounded border border-gray-100 bg-gray-50 p-4 text-sm"
                dangerouslySetInnerHTML={{
                  __html: selected.body_html
                    .replaceAll("{{name}}", "María")
                    .replaceAll("{{cta_url}}", "#")
                    .replaceAll("{{unsubscribe_url}}", "#"),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
