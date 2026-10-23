"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Mail, MessageCircle, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/panel/card"

/**
 * Ficha unica de una socia (admin): todo lo que antes estaba repartido por varias pantallas.
 * Datos: GET /api/admin/members/[id]. Las notas internas solo las ve la administradora.
 */

interface Ficha {
  profile: {
    id: string
    name: string
    email: string | null
    phone: string | null
    created_at: string
    document_type: string | null
    document_number: string | null
    shipping: { name: string; address: string; postal_code: string | null; city: string | null; province: string | null; country: string | null }
    stripe_customer_id: string | null
    referral_balance: number
  }
  account: { email_confirmed: boolean; last_sign_in_at: string | null; provider: string | null }
  identity: { status: string; verified_at: string | null }
  membership: {
    type: string
    status: string
    billing_cycle: string | null
    start_date: string | null
    end_date: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean | null
    past_due_since: string | null
    suspended_at: string | null
    failed_payment_count: number | null
    card: { brand: string | null; last4: string } | null
    stripe_subscription_id: string | null
  } | null
  passes: { available: number; used: number; expired: number }
  reservations: Array<{
    id: string
    status: string
    start_date: string
    end_date: string
    bag: string
    tracking_number: string | null
    return_tracking_number: string | null
  }>
  invoices: Array<{ id: string; number: string | null; amount_paid: number; currency: string; status: string | null; created: number; url: string | null }>
  colecciona: {
    credit: number
    progress: Array<{ id: string; status: string; mode: string; purchase_price: number; accumulated: number; bag: string; created_at: string }>
  }
  emails: Array<{ id: string; subject: string; email_type: string | null; status: string | null; sent_at: string | null; created_at: string }>
  notes: Array<{ id: string; body: string; created_at: string }>
  origin: { channel: string | null; self_reported: string | null } | null
}

const PLAN: Record<string, string> = { petite: "Petite", essentiel: "L'Essentiel", lessentiel: "L'Essentiel", signature: "Signature", prive: "Privé", free: "Sin plan" }
const MEMBERSHIP_STATUS: Record<string, string> = {
  active: "activa",
  cancelled_active: "cancelada, con acceso",
  cancelled: "cancelada",
  canceled: "cancelada",
  past_due: "pago pendiente",
  paused: "pausada",
  limited_access: "acceso limitado",
  expired: "caducada",
}
const RESERVATION_STATUS: Record<string, string> = {
  pending: "pendiente",
  confirmed: "confirmada",
  active: "en casa",
  overdue: "devolución vencida",
  completed: "completada",
  cancelled: "cancelada",
  queued: "próximo bolso (en cola)",
}
const ORIGIN: Record<string, string> = {
  organic_search: "Google (orgánico)",
  google_ads: "Google Ads",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  pinterest: "Pinterest",
  email: "Correo",
  direct: "Directo",
  referral_site: "Otra web",
  other_campaign: "Otra campaña",
}

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—"
const euro = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value)
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
const correosUrl = (tracking: string) =>
  `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${encodeURIComponent(tracking)}`
const whatsappUrl = (phone: string) => {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits.length === 9 ? `34${digits}` : digits}`
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {}
      }}
      className="ml-2 inline-flex align-middle text-slate-400 transition-colors hover:text-indigo-dark"
      aria-label="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#b08d57]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-800">{children}</span>
    </div>
  )
}

function Chip({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "slate" | "rose" | "green" }) {
  const tones = {
    gold: "bg-[#b08d57]/15 text-[#7a5f33]",
    slate: "bg-slate-100 text-slate-600",
    rose: "bg-rose-pastel/40 text-indigo-dark",
    green: "bg-emerald-50 text-emerald-800",
  }
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

const TABS = ["Reservas", "Pagos", "Colecciona", "Correos", "Notas"] as const

export default function MemberFichaPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id as string
  const [data, setData] = useState<Ficha | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]>("Reservas")
  const [noteText, setNoteText] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/members/${id}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "No se pudo cargar la ficha")
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) load()
  }, [id, load])

  const addNote = async () => {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/admin/members/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteText }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData((current) => (current ? { ...current, notes: [json.note, ...current.notes] } : current))
      setNoteText("")
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo guardar la nota")
    } finally {
      setSavingNote(false)
    }
  }

  const removeNote = async (noteId: string) => {
    if (!confirm("¿Borrar esta nota?")) return
    const res = await fetch(`/api/admin/members/${id}/notes?noteId=${noteId}`, { method: "DELETE" })
    if (res.ok) setData((current) => (current ? { ...current, notes: current.notes.filter((n) => n.id !== noteId) } : current))
  }

  const deleteAccount = async () => {
    if (!data) return
    if (!confirm(`¿Borrar la cuenta de ${data.profile.name}? Se eliminan su perfil, su acceso y sus datos. No se puede deshacer.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "No se pudo borrar")
      router.push("/admin/members")
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo borrar")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Link href="/admin/members" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-dark">
          <ArrowLeft className="h-4 w-4" /> Miembros
        </Link>
        <Card>
          <CardContent className="p-6 text-slate-600">{error || "No se encontró la socia"}</CardContent>
        </Card>
      </div>
    )
  }

  const { profile, membership } = data
  const s = profile.shipping
  const fullAddress = [s.address, [s.postal_code, s.city].filter(Boolean).join(" "), s.province, s.country].filter(Boolean).join(", ")
  const currentBag = data.reservations.find((r) => ["active", "confirmed", "overdue", "pending"].includes(r.status))
  const queuedBag = data.reservations.find((r) => r.status === "queued")
  const planLabel = membership ? PLAN[membership.type?.toLowerCase()] || membership.type : "Sin membresía"
  const statusLabel = membership ? MEMBERSHIP_STATUS[membership.status] || membership.status : ""
  const identityVerified = ["verified", "approved"].includes(data.identity.status)
  const nextDate = membership?.cancel_at_period_end || ["cancelled", "cancelled_active", "canceled"].includes(membership?.status || "")
    ? membership?.end_date
    : membership?.current_period_end || membership?.end_date

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link href="/admin/members" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-dark">
        <ArrowLeft className="h-4 w-4" /> Miembros
      </Link>

      {/* Cabecera */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#b08d57]/15 font-serif text-lg text-[#7a5f33]">
            {initials(profile.name)}
          </div>
          <div className="min-w-[200px] flex-1">
            <h1 className="font-serif text-2xl text-indigo-dark">{profile.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone={membership && ["active", "cancelled_active"].includes(membership.status) ? "gold" : "slate"}>
                {planLabel}
                {statusLabel ? ` · ${statusLabel}` : ""}
              </Chip>
              <Chip tone={identityVerified ? "green" : "rose"}>{identityVerified ? "Identidad verificada" : "Identidad sin verificar"}</Chip>
              <Chip tone="slate">Socia desde {day(profile.created_at)}</Chip>
              {data.origin?.channel && <Chip tone="slate">Origen: {ORIGIN[data.origin.channel] || data.origin.channel}</Chip>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.email && (
              <Button asChild variant="outline" size="sm" className="bg-transparent">
                <a href={`mailto:${profile.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Escribir
                </a>
              </Button>
            )}
            {profile.phone && (
              <Button asChild variant="outline" size="sm" className="bg-transparent">
                <a href={whatsappUrl(profile.phone)} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            )}
            {profile.stripe_customer_id && (
              <Button asChild variant="outline" size="sm" className="bg-transparent">
                <a href={`https://dashboard.stripe.com/customers/${profile.stripe_customer_id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver en Stripe
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Contacto y envio */}
        <Card>
          <CardContent className="p-5">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#b08d57]">Contacto y envío</p>
            <Row label="Teléfono">
              {profile.phone || "—"}
              {profile.phone && <CopyValue value={profile.phone} />}
            </Row>
            <Row label="Email">
              {profile.email || "—"}
              {profile.email && <CopyValue value={profile.email} />}
            </Row>
            <Row label="Dirección">
              {fullAddress || "Sin dirección"}
              {fullAddress && <CopyValue value={fullAddress} />}
            </Row>
            {s.name && <Row label="Destinatario">{s.name}</Row>}
            <Row label="Documento">
              {profile.document_number ? `${profile.document_type ? `${profile.document_type} ` : ""}${profile.document_number}` : "—"}
            </Row>
            <Row label="Último acceso">{day(data.account.last_sign_in_at)}</Row>
          </CardContent>
        </Card>

        {/* Membresia y pagos */}
        <Card>
          <CardContent className="p-5">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#b08d57]">Membresía y pagos</p>
            <Row label="Plan">
              {planLabel}
              {membership?.billing_cycle ? ` · ${membership.billing_cycle === "quarterly" ? "trimestral" : "mensual"}` : ""}
            </Row>
            <Row label={membership?.cancel_at_period_end ? "Acceso hasta" : "Próximo cobro"}>{day(nextDate)}</Row>
            <Row label="Tarjeta">
              {membership?.card ? `${membership.card.brand || "Tarjeta"} •••• ${membership.card.last4}` : "—"}
            </Row>
            {membership?.past_due_since && <Row label="Impago desde">{day(membership.past_due_since)}</Row>}
            <Row label="Crédito Colecciona">{euro(data.colecciona.credit)}</Row>
            <Row label="Pases de bolso">{data.passes.available}</Row>
          </CardContent>
        </Card>

        {/* Bolso ahora */}
        <Card>
          <CardContent className="p-5">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#b08d57]">Bolso ahora</p>
            {currentBag ? (
              <>
                <p className="font-serif text-xl text-indigo-dark">{currentBag.bag}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {RESERVATION_STATUS[currentBag.status] || currentBag.status} · devolución {day(currentBag.end_date)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentBag.tracking_number && (
                    <Button asChild variant="outline" size="sm" className="bg-transparent">
                      <a href={correosUrl(currentBag.tracking_number)} target="_blank" rel="noreferrer">
                        Envío en Correos
                      </a>
                    </Button>
                  )}
                  {currentBag.return_tracking_number && (
                    <Button asChild variant="outline" size="sm" className="bg-transparent">
                      <a href={correosUrl(currentBag.return_tracking_number)} target="_blank" rel="noreferrer">
                        Devolución en Correos
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm" className="bg-transparent">
                    <Link href="/admin/logistics">Ir a Logística</Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Ahora mismo no tiene ningún bolso.</p>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Próximo en cola: {queuedBag ? queuedBag.bag : "ninguno"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas */}
      <Card>
        <div className="flex gap-1 overflow-x-auto border-b border-indigo-dark/10 px-3">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                tab === name ? "border-[#b08d57] font-medium text-indigo-dark" : "border-transparent text-slate-500 hover:text-indigo-dark"
              }`}
            >
              {name}
              {name === "Notas" && data.notes.length > 0 ? ` (${data.notes.length})` : ""}
            </button>
          ))}
        </div>
        <CardContent className="p-5">
          {tab === "Reservas" &&
            (data.reservations.length === 0 ? (
              <p className="text-sm text-slate-500">Sin reservas todavía.</p>
            ) : (
              <div className="divide-y divide-indigo-dark/10">
                {data.reservations.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="font-serif text-base text-indigo-dark">{r.bag}</span>
                    <span className="text-slate-500">
                      {day(r.start_date)} – {day(r.end_date)} · {RESERVATION_STATUS[r.status] || r.status}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          {tab === "Pagos" &&
            (data.invoices.length === 0 ? (
              <p className="text-sm text-slate-500">Sin facturas en Stripe{profile.stripe_customer_id ? "" : " (no tiene cliente en Stripe)"}.</p>
            ) : (
              <div className="divide-y divide-indigo-dark/10">
                {data.invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="text-slate-700">
                      {inv.number || inv.id} · {new Date(inv.created * 1000).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-serif text-base text-indigo-dark">{euro(inv.amount_paid / 100)}</span>
                      <Chip tone={inv.status === "paid" ? "green" : inv.status === "open" ? "rose" : "slate"}>
                        {inv.status === "paid" ? "pagada" : inv.status === "open" ? "pendiente" : inv.status || "—"}
                      </Chip>
                      {inv.url && (
                        <a href={inv.url} target="_blank" rel="noreferrer" className="text-[#7a5f33] hover:underline">
                          Ver
                        </a>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          {tab === "Colecciona" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Crédito acumulado (saldo de la socia): <span className="font-serif text-lg text-indigo-dark">{euro(data.colecciona.credit)}</span>
              </p>
              {data.colecciona.progress.length === 0 ? (
                <p className="text-sm text-slate-500">No ha empezado Colecciona con ningún bolso.</p>
              ) : (
                <div className="divide-y divide-indigo-dark/10">
                  {data.colecciona.progress.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <span className="font-serif text-base text-indigo-dark">{p.bag}</span>
                      <span className="text-slate-500">
                        {p.status === "active" ? "en curso" : p.status === "completed" ? "comprado" : p.status === "cancelled" ? "renunciado" : p.status} ·{" "}
                        {euro(p.accumulated)} de {euro(p.purchase_price)} · {day(p.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "Correos" &&
            (data.emails.length === 0 ? (
              <p className="text-sm text-slate-500">Todavía no se le ha enviado ningún correo registrado.</p>
            ) : (
              <div className="divide-y divide-indigo-dark/10">
                {data.emails.map((mail) => (
                  <div key={mail.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="text-slate-700">{mail.subject}</span>
                    <span className="text-slate-500">
                      {day(mail.sent_at || mail.created_at)} · {mail.status === "sent" ? "enviado" : mail.status || "—"}
                    </span>
                  </div>
                ))}
              </div>
            ))}

          {tab === "Notas" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Escribe una nota interna (la socia nunca la ve)"
                  className="flex-1 rounded-md border border-indigo-dark/15 bg-white p-3 text-sm focus:border-[#b08d57] focus:outline-none"
                />
                <Button onClick={addNote} disabled={savingNote || !noteText.trim()} className="h-auto bg-indigo-dark text-white hover:bg-indigo-dark/90">
                  {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              {data.notes.length === 0 ? (
                <p className="text-sm text-slate-500">Sin notas.</p>
              ) : (
                <div className="space-y-3">
                  {data.notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-[#b08d57]/20 bg-[#b08d57]/[0.06] p-3 text-sm">
                      <p className="whitespace-pre-wrap text-slate-800">{note.body}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{day(note.created_at)}</span>
                        <button type="button" onClick={() => removeNote(note.id)} className="hover:text-red-700" aria-label="Borrar nota">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zona delicada */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-medium text-slate-800">Borrar cuenta</p>
            <p className="text-xs text-slate-500">
              Solo si no tiene pagos, reservas ni una membresía viva (por ejemplo, cuentas de prueba o duplicadas). Stripe no se toca.
            </p>
          </div>
          <Button variant="outline" onClick={deleteAccount} disabled={deleting} className="border-red-200 bg-transparent text-red-700 hover:bg-red-50">
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Borrar cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
