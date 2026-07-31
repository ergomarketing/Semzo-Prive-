"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Mail,
  Users,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Subscriber {
  id: string
  email: string
  name: string | null
  status: string
  subscribed_at: string
}

interface CampaignBlock {
  preheader: string    // texto de previsualización en el cliente de correo
  headline: string     // título principal del email
  body: string         // cuerpo principal (soporta HTML básico)
  ctaLabel: string     // texto del botón CTA
  ctaUrl: string       // URL del CTA
  footer: string       // texto del pie (empresa, dirección…)
  accentColor: string  // color de acento (botón, header)
}

type Audience = "newsletter" | "leads" | "both"

const AUDIENCE_LABELS: Record<Audience, string> = {
  newsletter: "Solo newsletter",
  leads:      "Solo leads (secuencia activa)",
  both:       "Todos (newsletter + leads)",
}

const SEMZO_GOLD  = "#c9a96e"
const SEMZO_NAVY  = "#1a1f3a"

const DEFAULT_BLOCK: CampaignBlock = {
  preheader:   "",
  headline:    "Novedades en SEMZO Privé",
  body:        "<p>Hola {{name}},</p>\n<p>Tenemos algo especial para ti esta semana.</p>",
  ctaLabel:    "Descúbrelo ahora",
  ctaUrl:      "https://semzoprive.com/catalog",
  footer:      "SEMZO Privé · Madrid, España",
  accentColor: SEMZO_NAVY,
}

// ─── HTML builder ────────────────────────────────────────────────────────────

function buildHtml(block: CampaignBlock, previewName = "{{name}}", unsubUrl = "{{unsubscribe_url}}"): string {
  const btnBg   = block.accentColor
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${block.headline}</title>
  ${block.preheader ? `<div style="display:none;font-size:1px;color:#fef;max-height:0;overflow:hidden;">${block.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
</head>
<body style="margin:0;padding:0;background:#f9f6f1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:600px;width:100%;border-collapse:collapse;">

        <!-- Header -->
        <tr>
          <td style="background:${btnBg};padding:28px 40px;text-align:center;">
            <span style="color:${SEMZO_GOLD};font-family:Georgia,serif;font-size:20px;letter-spacing:5px;font-weight:400;">SEMZO PRIVÉ</span>
          </td>
        </tr>

        <!-- Headline -->
        <tr>
          <td style="padding:40px 40px 0 40px;">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:400;color:${SEMZO_NAVY};line-height:1.3;">${block.headline}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 40px;color:#333333;font-size:16px;line-height:1.75;font-family:Georgia,serif;">
            ${block.body.replace("{{name}}", previewName)}
          </td>
        </tr>

        <!-- CTA -->
        ${block.ctaLabel && block.ctaUrl ? `
        <tr>
          <td style="padding:8px 40px 40px 40px;text-align:center;">
            <a href="${block.ctaUrl}" style="display:inline-block;background:${btnBg};color:#ffffff;font-family:Georgia,serif;font-size:15px;letter-spacing:2px;padding:14px 36px;text-decoration:none;border-radius:2px;">${block.ctaLabel}</a>
          </td>
        </tr>` : ""}

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #ecdede;margin:0;" />
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;font-size:12px;color:#999999;font-family:Arial,sans-serif;line-height:1.6;">
            ${block.footer}<br>
            <a href="${unsubUrl}" style="color:#c9a96e;text-decoration:underline;font-size:11px;">Darse de baja</a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewsletterPage() {
  const [subscribers,  setSubscribers]  = useState<Subscriber[]>([])
  const [leadsCount,   setLeadsCount]   = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [showList,     setShowList]     = useState(false)
  const [showPreview,  setShowPreview]  = useState(false)

  // Campaign form
  const [subject,      setSubject]      = useState("")
  const [audience,     setAudience]     = useState<Audience>("both")
  const [block,        setBlock]        = useState<CampaignBlock>(DEFAULT_BLOCK)
  const [sending,      setSending]      = useState(false)
  const [result,       setResult]       = useState<{ type: "success" | "error"; message: string } | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [nsRes, leadsRes] = await Promise.all([
        fetch("/api/admin/newsletter"),
        fetch("/api/admin/leads?page=1&status=lead"),
      ])
      if (nsRes.ok) {
        const d = await nsRes.json()
        setSubscribers(d.subscribers || [])
      }
      if (leadsRes.ok) {
        const d = await leadsRes.json()
        setLeadsCount(d.stats?.active ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Send ─────────────────────────────────────────────────────────────────

  async function handleSend() {
    if (!subject.trim()) { setResult({ type: "error", message: "El asunto es obligatorio" }); return }
    if (!block.headline.trim() && !block.body.trim()) {
      setResult({ type: "error", message: "El email necesita al menos un titular o cuerpo" })
      return
    }
    setSending(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          content: buildHtml(block),   // full HTML template
          audience,
          raw_html: true,              // tell the server the content is already wrapped HTML
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ type: "success", message: `Enviado a ${data.sent} destinatario${data.sent !== 1 ? "s" : ""}${data.failed ? ` (${data.failed} fallidos)` : ""}` })
      } else {
        setResult({ type: "error", message: data.error || "Error al enviar" })
      }
    } catch {
      setResult({ type: "error", message: "Error de red al enviar" })
    } finally {
      setSending(false)
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const activeSubscribers = subscribers.filter((s) => s.status === "active")
  const audienceCount =
    audience === "newsletter" ? activeSubscribers.length :
    audience === "leads"      ? leadsCount :
    activeSubscribers.length + leadsCount

  const previewHtml = buildHtml(block, "María", "#")

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1f3a]">Email Marketing</h1>
            <p className="mt-1 text-sm text-gray-500">Campañas de newsletter y comunicaciones a leads</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Suscriptores activos" value={activeSubscribers.length} />
          <StatCard icon={<Mail  className="h-5 w-5" />} label="Leads activos"         value={leadsCount} />
          <StatCard icon={<Users className="h-5 w-5" />} label="Total suscriptores"    value={subscribers.length} />
          <StatCard
            icon={<Send className="h-5 w-5" />}
            label="Audiencia seleccionada"
            value={audienceCount}
            accent
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* ── Campaign composer ────────────────────────────────────────── */}
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-[#1a1f3a]">Nueva campaña</h2>

            {/* Subject */}
            <Field label="Asunto del email">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Novedades de julio en SEMZO Privé"
              />
            </Field>

            {/* Preheader */}
            <Field label="Texto de previsualización (preheader)" hint="Aparece en el inbox tras el asunto">
              <Input
                value={block.preheader}
                onChange={(e) => setBlock({ ...block, preheader: e.target.value })}
                placeholder="Ej: Tu próximo bolso favorito ya está disponible…"
              />
            </Field>

            {/* Audience */}
            <Field label="Audiencia">
              <div className="flex flex-wrap gap-2">
                {(["both", "newsletter", "leads"] as Audience[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      audience === a
                        ? "border-[#1a1f3a] bg-[#1a1f3a] text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {AUDIENCE_LABELS[a]}
                    {audience === a && (
                      <span className="ml-1.5 opacity-75">({audienceCount})</span>
                    )}
                  </button>
                ))}
              </div>
            </Field>

            {/* Accent color */}
            <Field label="Color de acento (header y botón)">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={block.accentColor}
                  onChange={(e) => setBlock({ ...block, accentColor: e.target.value })}
                  className="h-9 w-16 cursor-pointer rounded border border-gray-200"
                />
                <span className="font-mono text-sm text-gray-500">{block.accentColor}</span>
                <button
                  onClick={() => setBlock({ ...block, accentColor: SEMZO_NAVY })}
                  className="text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Restablecer
                </button>
              </div>
            </Field>

            {/* Headline */}
            <Field label="Titular">
              <Input
                value={block.headline}
                onChange={(e) => setBlock({ ...block, headline: e.target.value })}
                placeholder="Ej: Nuevas llegadas de temporada"
              />
            </Field>

            {/* Body */}
            <Field label="Cuerpo del email (HTML)" hint="Puedes usar {{name}} para personalizar el nombre">
              <Textarea
                value={block.body}
                onChange={(e) => setBlock({ ...block, body: e.target.value })}
                rows={8}
                className="font-mono text-sm"
                placeholder="<p>Hola {{name}},</p><p>...</p>"
              />
            </Field>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Texto del botón CTA">
                <Input
                  value={block.ctaLabel}
                  onChange={(e) => setBlock({ ...block, ctaLabel: e.target.value })}
                  placeholder="Ej: Ver colección"
                />
              </Field>
              <Field label="URL del botón">
                <Input
                  value={block.ctaUrl}
                  onChange={(e) => setBlock({ ...block, ctaUrl: e.target.value })}
                  placeholder="https://semzoprive.com/catalog"
                />
              </Field>
            </div>

            {/* Footer */}
            <Field label="Pie del email">
              <Input
                value={block.footer}
                onChange={(e) => setBlock({ ...block, footer: e.target.value })}
                placeholder="SEMZO Privé · Madrid, España"
              />
            </Field>

            {/* Result */}
            {result && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                  result.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {result.type === "success" ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                {result.message}
              </div>
            )}

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={sending}
              className="w-full bg-[#1a1f3a] text-white hover:bg-[#2a2f5a]"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando a {audienceCount} destinatarios...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar campaña a {audienceCount} destinatarios
                </>
              )}
            </Button>
          </div>

          {/* ── Live preview ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1f3a]">Vista previa</h2>
              <button
                onClick={() => setShowPreview((p) => !p)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {/* Subject line preview */}
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Cómo se ve en el inbox</p>
              <p className="mt-1 font-medium text-gray-900">{subject || <span className="italic text-gray-400">Sin asunto</span>}</p>
              {block.preheader && (
                <p className="mt-0.5 truncate text-sm text-gray-400">{block.preheader}</p>
              )}
            </div>

            {showPreview && (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-400">
                  Preview con nombre: <strong>María</strong>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  className="h-[600px] w-full"
                  title="Email preview"
                  sandbox="allow-same-origin"
                />
              </div>
            )}

            {!showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition"
              >
                <Eye className="mr-2 h-4 w-4" />
                Hacer clic para ver la vista previa del email
              </button>
            )}
          </div>
        </div>

        {/* ── Subscriber list ─────────────────────────────────────────────── */}
        <div className="mt-10 rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => setShowList((s) => !s)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span className="font-semibold text-[#1a1f3a]">
              Lista de suscriptores ({subscribers.length})
            </span>
            {showList ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {showList && (
            <div className="border-t border-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </div>
              ) : subscribers.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-400">No hay suscriptores aún</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                        <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                        <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                        <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Suscrito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-[#1a1f3a]">{sub.email}</td>
                          <td className="px-6 py-3 text-gray-600">{sub.name || "—"}</td>
                          <td className="px-6 py-3">
                            <Badge
                              className={
                                sub.status === "active"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                              }
                            >
                              {sub.status === "active" ? "Activo" : sub.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-400">
                            {new Date(sub.subscribed_at).toLocaleDateString("es-ES")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${accent ? "border-[#1a1f3a] bg-[#1a1f3a] text-white" : "border-gray-200 bg-white"}`}
    >
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-md ${accent ? "bg-white/10" : "bg-gray-100"}`}>
        <span className={accent ? "text-white" : "text-[#1a1f3a]"}>{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-[#1a1f3a]"}`}>{value}</p>
      <p className={`mt-0.5 text-xs ${accent ? "text-white/70" : "text-gray-500"}`}>{label}</p>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {hint && <p className="mb-1.5 text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  )
}
