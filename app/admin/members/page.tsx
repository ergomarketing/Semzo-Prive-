"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Mail, RefreshCw, Search, Send, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/panel/card"
import { PageHeader } from "@/components/panel/page-header"

interface Member {
  id: string
  name: string
  email: string
  phone: string
  membership: string
  membershipStatus: string
  joinDate: string
  status: string
  totalRentals: number
  passesAvailable: number
}

const PLAN_LABEL: Record<string, string> = {
  petite: "Petite",
  essentiel: "L'Essentiel",
  lessentiel: "L'Essentiel",
  signature: "Signature",
  prive: "Privé",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  cancelled_active: "Cancelada, con acceso",
  past_due: "Pago pendiente",
  paused: "Pausada",
  limited_access: "Acceso limitado",
  pending_verification: "Verificación pendiente",
  paid_pending_verification: "Verificación pendiente",
  no_membership: "Sin membresía",
}

const PAGE_SIZE = 40

const day = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")

function Chip({ children, tone }: { children: React.ReactNode; tone: "gold" | "slate" | "rose" }) {
  const tones = {
    gold: "bg-[#b08d57]/15 text-[#7a5f33]",
    slate: "bg-slate-100 text-slate-600",
    rose: "bg-rose-pastel/40 text-indigo-dark",
  }
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export default function MembersAdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState({ total: 0, petite: 0, essentiel: 0, signature: 0, prive: 0, free: 0, active: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sort, setSort] = useState<"recent" | "name" | "rentals">("recent")
  const [visible, setVisible] = useState(PAGE_SIZE)

  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 3000)
    return () => clearTimeout(timer)
  }, [notification])

  // Al cambiar la busqueda o un filtro se vuelve a la primera pagina.
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [query, planFilter, statusFilter, sort])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/members")
      if (!response.ok) throw new Error("No se pudieron cargar las socias")
      const data = await response.json()
      setMembers(data.members || [])
      setStats(data.stats || stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setLoading(false)
    }
  }

  const handleContact = (member: Member) => {
    setSelectedMember(member)
    setEmailSubject(`Contacto desde Semzo Privé - ${member.name}`)
    setEmailBody(`Hola ${member.name},\n\n`)
    setShowEmailDialog(true)
  }

  const handleSendEmail = async () => {
    if (!selectedMember) return
    setSendingEmail(true)
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: selectedMember.email, subject: emailSubject, body: emailBody }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setShowEmailDialog(false)
      setEmailSubject("")
      setEmailBody("")
      setNotification({ type: "success", message: "Correo enviado" })
    } catch {
      setNotification({ type: "error", message: "No se pudo enviar el correo" })
    } finally {
      setSendingEmail(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = members.filter((m) => {
      if (q && !`${m.name} ${m.email} ${m.phone}`.toLowerCase().includes(q)) return false
      const plan = (m.membership || "free").toLowerCase()
      if (planFilter === "none") {
        if (plan !== "free" && m.membershipStatus !== "no_membership") return false
      } else if (planFilter !== "all") {
        const normalized = plan === "lessentiel" ? "essentiel" : plan
        if (normalized !== planFilter) return false
      }
      if (statusFilter === "active" && m.status !== "active") return false
      if (statusFilter === "inactive" && m.status === "active") return false
      if (["past_due", "paused", "cancelled_active"].includes(statusFilter) && m.membershipStatus !== statusFilter) return false
      return true
    })
    const sorted = [...list]
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "es"))
    if (sort === "rentals") sorted.sort((a, b) => b.totalRentals - a.totalRentals)
    if (sort === "recent") sorted.sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    return sorted
  }, [members, query, planFilter, statusFilter, sort])

  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Con membresía viva", value: stats.active },
    { label: "Petite", value: stats.petite },
    { label: "L'Essentiel", value: stats.essentiel },
    { label: "Signature", value: stats.signature },
    { label: "Privé", value: stats.prive },
  ]

  const selectClass =
    "h-10 rounded-md border border-indigo-dark/15 bg-white px-3 text-sm text-slate-700 focus:border-[#b08d57] focus:outline-none"

  return (
    <div className="mx-auto max-w-6xl">
      {notification && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg px-6 py-3 text-sm text-white shadow-lg ${
            notification.type === "success" ? "bg-indigo-dark" : "bg-red-700"
          }`}
        >
          {notification.message}
        </div>
      )}

      <PageHeader
        eyebrow="Miembros y pagos"
        title="Miembros"
        subtitle="Todas las socias y clientas en un solo sitio. Pulsa «Ver ficha» para ver todo de una socia."
        action={
          <Button onClick={fetchMembers} variant="outline" className="border-indigo-dark/15 bg-transparent">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className="mt-1 font-serif text-3xl text-indigo-dark">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono"
            className="h-10 border-indigo-dark/15 bg-white pl-9"
          />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={selectClass} aria-label="Plan">
          <option value="all">Todos los planes</option>
          <option value="petite">Petite</option>
          <option value="essentiel">L'Essentiel</option>
          <option value="signature">Signature</option>
          <option value="prive">Privé</option>
          <option value="none">Sin plan</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} aria-label="Estado">
          <option value="all">Todos los estados</option>
          <option value="active">Con membresía viva</option>
          <option value="inactive">Sin membresía viva</option>
          <option value="past_due">Pago pendiente</option>
          <option value="paused">Pausadas</option>
          <option value="cancelled_active">Canceladas, con acceso</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectClass} aria-label="Orden">
          <option value="recent">Más recientes</option>
          <option value="name">Por nombre</option>
          <option value="rentals">Más alquileres</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Cargando…
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchMembers} className="mt-4 bg-indigo-dark text-white hover:bg-indigo-dark/90">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-[#b08d57]" />
            <p className="text-slate-600">{members.length === 0 ? "Todavía no hay socias." : "Ninguna socia coincide con esa búsqueda."}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-500">
            Mostrando {Math.min(visible, filtered.length)} de {filtered.length}
          </p>
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_70px_100px_minmax(0,1.3fr)] gap-4 border-b border-indigo-dark/10 px-5 py-3 text-xs uppercase tracking-wide text-slate-500 lg:grid">
              <span>Socia</span>
              <span>Teléfono</span>
              <span>Plan y estado</span>
              <span>Alquil.</span>
              <span>Alta</span>
              <span className="text-right">Acciones</span>
            </div>
            <div className="divide-y divide-indigo-dark/10">
              {filtered.slice(0, visible).map((m) => {
                const planKey = (m.membership || "free").toLowerCase()
                const plan = PLAN_LABEL[planKey]
                const live = m.status === "active"
                return (
                  <div
                    key={m.id}
                    className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-rose-nude/30 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_70px_100px_minmax(0,1.3fr)] lg:gap-4"
                  >
                    <Link href={`/admin/members/${m.id}`} className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#b08d57]/15 font-serif text-sm text-[#7a5f33]">
                        {initials(m.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-serif text-lg text-indigo-dark">{m.name}</span>
                        <span className="block truncate text-xs text-slate-500">{m.email}</span>
                      </span>
                    </Link>
                    <span className="text-sm text-slate-600">{m.phone && m.phone !== "No disponible" ? m.phone : "—"}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {plan && <Chip tone={live ? "gold" : "slate"}>{plan}</Chip>}
                      <Chip tone={live ? "gold" : m.membershipStatus === "past_due" ? "rose" : "slate"}>
                        {STATUS_LABEL[m.membershipStatus] || "Sin membresía"}
                      </Chip>
                    </span>
                    <span className="font-serif text-lg text-indigo-dark">{m.totalRentals}</span>
                    <span className="text-xs text-slate-500">{day(m.joinDate)}</span>
                    <span className="flex items-center justify-start gap-2 lg:justify-end">
                      <Button asChild size="sm" className="bg-indigo-dark text-white hover:bg-indigo-dark/90">
                        <Link href={`/admin/members/${m.id}`}>Ver ficha</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContact(m)}
                        aria-label={`Escribir a ${m.name}`}
                        className="border-indigo-dark/15 bg-transparent"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
          {visible < filtered.length && (
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="border-indigo-dark/15 bg-transparent">
                Mostrar más
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-indigo-dark">Enviar correo</DialogTitle>
            <DialogDescription>
              A {selectedMember?.name} ({selectedMember?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Asunto</Label>
              <Input id="email-subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email-body">Mensaje</Label>
              <Textarea id="email-body" rows={8} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)} disabled={sendingEmail}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
