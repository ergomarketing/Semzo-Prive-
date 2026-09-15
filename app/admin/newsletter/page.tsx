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
  preheader: string          // texto de previsualización en el cliente de correo
  eyebrow: string            // etiqueta pequeña sobre el logo, dentro del header (opcional)
  headline: string           // título principal del email (Playfair Display)
  body: string                // cuerpo principal — admite HTML completo con estilos inline
  ctaLabel: string            // texto del botón CTA principal
  ctaUrl: string               // URL del CTA principal
  ctaSecondaryLabel: string    // texto del enlace CTA secundario (opcional)
  ctaSecondaryUrl: string      // URL del CTA secundario (opcional)
}

type Audience = "newsletter" | "leads" | "both"

const AUDIENCE_LABELS: Record<Audience, string> = {
  newsletter: "Solo newsletter",
  leads:      "Solo leads (secuencia activa)",
  both:       "Todos (newsletter + leads)",
}

// Paleta fija de la plantilla de marca — no configurable por campaña,
// para que todos los envíos mantengan la misma identidad visual.
// SEMZO_BLUSH (#fff0f3) y bordes #f4c4cc quedan disponibles para que el
// campo "Cuerpo" pueda usarlos en bloques destacados dentro del HTML pegado.
const SEMZO_NAVY  = "#1a1a4b"
const SEMZO_GOLD  = "#c9a96e"
const SEMZO_PINK  = "#f4c4cc"
const SEMZO_GRAY  = "#7a7a94"
const SYSTEM_FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const SERIF_FONT  = "'Playfair Display',Georgia,serif"
const LOGO_URL     = "https://semzoprive.com/images/logo-semzo-prive.png"

const DEFAULT_BLOCK: CampaignBlock = {
  preheader:         "",
  eyebrow:           "",
  headline:          "Novedades en SEMZO Privé",
  body:              "<p style=\"margin:0 0 20px 0;\">Hola {{nombre}},</p>\n<p style=\"margin:0 0 20px 0;\">Tenemos algo especial para ti esta semana.</p>",
  ctaLabel:          "Descúbrelo ahora",
  ctaUrl:            "https://semzoprive.com/catalog",
  ctaSecondaryLabel: "",
  ctaSecondaryUrl:   "",
}

// ─── HTML builder ────────────────────────────────────────────────────────────

function buildHtml(block: CampaignBlock, previewName = "{{name}}", unsubUrl = "{{unsubscribe_url}}"): string {
  const year = new Date().getFullYear()
  const personalize = (s: string) =>
    s.replace(/\{\{\s*name\s*\}\}/gi, previewName).replace(/\{\{\s*nombre\s*\}\}/gi, previewName)

  const eyebrowHtml = block.eyebrow
    ? `<p style="margin:0 0 16px 0;font-family:${SYSTEM_FONT};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${SEMZO_PINK};text-align:center;">${personalize(block.eyebrow)}</p>`
    : ""

  const headlineHtml = block.headline
    ? `<h1 style="margin:0 0 20px 0;font-family:${SERIF_FONT};font-weight:500;font-size:26px;line-height:1.3;color:${SEMZO_NAVY};text-align:center;letter-spacing:-0.3px;">${personalize(block.headline)}</h1>`
    : ""

  const ctaHtml = block.ctaLabel && block.ctaUrl
    ? `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:12px 20px 12px 20px;">
            <a href="${block.ctaUrl}" style="display:inline-block;background-color:${SEMZO_NAVY};color:#ffffff;font-family:${SYSTEM_FONT};font-size:15px;font-weight:500;text-decoration:none;padding:18px 56px;letter-spacing:2px;text-transform:uppercase;border:none;min-width:220px;text-align:center;box-shadow:0 4px 12px rgba(26,26,75,0.2);">
              ${block.ctaLabel}
            </a>
          </td>
        </tr>
      </table>`
    : ""

  const ctaSecondaryHtml = block.ctaSecondaryLabel && block.ctaSecondaryUrl
    ? `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:0 20px 32px 20px;">
            <a href="${block.ctaSecondaryUrl}" style="display:inline-block;color:${SEMZO_NAVY};font-family:${SERIF_FONT};font-style:italic;font-size:15px;text-decoration:underline;text-underline-offset:3px;">
              ${block.ctaSecondaryLabel}
            </a>
          </td>
        </tr>
      </table>`
    : ""

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${block.headline || "SEMZO PRIVÉ"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Great+Vibes&display=swap" rel="stylesheet">
  ${block.preheader ? `<div style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${personalize(block.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f9f8f9;font-family:${SYSTEM_FONT};">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;margin:0 auto;border-collapse:collapse;">
    <tr>
      <td style="padding:0;background-color:#ffffff;">

        <!-- ═══ HEADER (fijo) ═══ -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="background-color:${SEMZO_NAVY};padding:40px 30px 36px 30px;">
              ${eyebrowHtml}
              <img src="${LOGO_URL}" alt="SEMZO PRIVÉ" width="180" style="display:block;height:auto;max-width:180px;border:0;margin:0 auto;" />
            </td>
          </tr>
        </table>

        <!-- ═══ CUERPO (variable por campaña) ═══ -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:40px 20px 8px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:440px;border-collapse:collapse;">
                <tr>
                  <td style="padding:0;">
                    ${headlineHtml}
                    <div style="color:${SEMZO_NAVY};font-size:16px;line-height:1.8;font-family:${SYSTEM_FONT};">
                      ${personalize(block.body)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ═══ CTA ═══ -->
        ${ctaHtml}
        ${ctaSecondaryHtml}

        <!-- ═══ FOOTER (fijo) ═══ -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;padding-top:10px;">
          <tr>
            <td align="center" style="padding:28px 20px 30px 20px;">

              <p style="margin:0;font-family:'Great Vibes',cursive;font-size:42px;color:${SEMZO_NAVY};text-align:center;letter-spacing:1px;line-height:1.2;">
                Erika
              </p>
              <p style="margin:4px 0 0 0;font-size:14px;color:${SEMZO_GRAY};letter-spacing:0.5px;text-align:center;">
                Fundadora de SEMZO PRIVÉ
              </p>

              <div style="width:30px;height:1px;background-color:${SEMZO_GOLD};margin:20px auto 18px auto;"></div>

              <p style="margin:0;font-family:${SERIF_FONT};font-size:18px;line-height:1.5;font-style:italic;color:${SEMZO_NAVY};text-align:center;letter-spacing:-0.2px;">
                &quot;El verdadero lujo no consiste en tener más.<br />Consiste en elegir mejor.&quot;
              </p>

              <div style="width:40px;height:1px;background-color:${SEMZO_GOLD};margin:24px auto 20px auto;"></div>

              <p style="margin:0 0 2px 0;font-family:${SERIF_FONT};font-size:20px;font-weight:600;color:${SEMZO_NAVY};letter-spacing:0.5px;text-align:center;">
                SEMZO PRIVÉ
              </p>
              <p style="margin:0;font-family:${SERIF_FONT};font-size:14px;font-style:italic;color:${SEMZO_GRAY};text-align:center;letter-spacing:0.3px;">
                Tu puerta de acceso al armario de tus sueños
              </p>

              <div style="height:18px;"></div>

              <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://instagram.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/instagram/1e1b4b" width="24" height="24" alt="Instagram" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://pinterest.com/semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/pinterest/1e1b4b" width="24" height="24" alt="Pinterest" style="display:block;border:0;" />
                    </a>
                  </td>
                  <td align="center" style="padding:0 12px;">
                    <a href="https://tiktok.com/@semzoprive" target="_blank" style="display:inline-block;text-decoration:none;background-color:#f6c1c8;border-radius:50%;padding:10px;">
                      <img src="https://cdn.simpleicons.org/tiktok/1e1b4b" width="24" height="24" alt="TikTok" style="display:block;border:0;" />
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:0 20px 14px 20px;font-size:9px;color:#d0d0d0;letter-spacing:0.3px;">
              <span>© ${year} SEMZO PRIVÉ · </span><a href="${unsubUrl}" style="color:#d0d0d0;text-decoration:none;">Darse de baja</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
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

  // ── Derived ────────────────────────────────────��──────────────────────��──

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

            {/* Eyebrow */}
            <Field label="Eyebrow (opcional)" hint="Etiqueta pequeña sobre el logo, dentro del header">
              <Input
                value={block.eyebrow}
                onChange={(e) => setBlock({ ...block, eyebrow: e.target.value })}
                placeholder="Ej: Cinco nuevas incorporaciones en Burdeos"
              />
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
            <Field
              label="Cuerpo del email (HTML)"
              hint="Admite HTML completo con estilos inline (tablas, negritas, listas...). Usa {{name}} o {{nombre}} para personalizar"
            >
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

            {/* CTA secundario */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Texto del enlace secundario (opcional)">
                <Input
                  value={block.ctaSecondaryLabel}
                  onChange={(e) => setBlock({ ...block, ctaSecondaryLabel: e.target.value })}
                  placeholder="Ej: Saber más sobre Colecciona"
                />
              </Field>
              <Field label="URL del enlace secundario">
                <Input
                  value={block.ctaSecondaryUrl}
                  onChange={(e) => setBlock({ ...block, ctaSecondaryUrl: e.target.value })}
                  placeholder="https://semzoprive.com/support#faq"
                />
              </Field>
            </div>

            <p className="rounded-md bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-500">
              El header (logo) y el footer (firma de Erika, frase de marca y redes) son fijos en
              todas las campañas y siguen el diseño de marca de SEMZO PRIVÉ.
            </p>

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
