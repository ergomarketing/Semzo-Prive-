"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Calendar, CheckCircle2, DollarSign, Loader2, Mail, Package, QrCode, Users } from "lucide-react"
import { Card, CardContent } from "@/components/panel/card"
import { PageHeader } from "@/components/panel/page-header"

interface DashboardStats {
  totalBags: number
  availableBags: number
  rentedBags: number
  totalReservations: number
  activeReservations: number
  totalMembers: number
  monthlyRevenue: number
}

interface AttentionItem {
  key: string
  title: string
  hint: string
  count: number
  href: string
  tone: "rose" | "gold" | "slate"
  names: string[]
}

const TONE: Record<AttentionItem["tone"], { dot: string; card: string }> = {
  rose: { dot: "bg-rose-400", card: "border-rose-pastel bg-rose-nude/60" },
  gold: { dot: "bg-[#b08d57]", card: "" },
  slate: { dot: "bg-slate-300", card: "" },
}

const euro = (value: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value)

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [items, setItems] = useState<AttentionItem[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const load = async (url: string, onData: (data: any) => void) => {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(response.statusText)
        onData(await response.json())
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        console.error(`Error cargando ${url}:`, error)
      }
    }
    load("/api/admin/dashboard-stats", setStats)
    load("/api/admin/dashboard-attention", (data) => setItems(data.items || []))
    return () => controller.abort()
  }, [])

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })

  const kpis = stats
    ? [
        { title: "Bolsos disponibles", value: String(stats.availableBags), subtitle: `${stats.rentedBags} alquilados de ${stats.totalBags}`, icon: Package, href: "/admin/inventory" },
        { title: "Reservas activas", value: String(stats.activeReservations), subtitle: `${stats.totalReservations} en total`, icon: Calendar, href: "/admin/reservations" },
        { title: "Socias", value: String(stats.totalMembers), subtitle: "Con membresía viva", icon: Users, href: "/admin/members" },
        { title: "Ingresos del mes", value: euro(stats.monthlyRevenue), subtitle: "Cobros de Stripe del mes en curso", icon: DollarSign, href: "/admin/payments" },
      ]
    : []

  const shortcuts = [
    { label: "Logística", hint: "Envíos y devoluciones", href: "/admin/logistics", icon: Package },
    { label: "Enviar newsletter", hint: "Comunicar con miembros", href: "/admin/newsletter", icon: Mail },
    { label: "Generar invitaciones", hint: "QR con código PRIVE50", href: "/admin/invitaciones", icon: QrCode },
    { label: "Publicar artículo", hint: "Crear contenido", href: "/admin/blog", icon: Mail },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="General" title="Dashboard" subtitle={`Hoy es ${today}`} />

      {/* Lo que necesita tu atencion hoy */}
      <section className="mb-10">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#b08d57]">Requiere tu atención</p>
        {items === null ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Revisando lo pendiente…
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-slate-600">
              <CheckCircle2 className="h-5 w-5 text-[#b08d57]" />
              Todo al día: no hay nada pendiente ahora mismo.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Link key={item.key} href={item.href} className="group">
                <Card className={`h-full transition-colors hover:border-indigo-dark/30 ${TONE[item.tone].card}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${TONE[item.tone].dot}`} />
                          <p className="text-sm font-medium text-indigo-dark">{item.title}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
                      </div>
                      <span className="font-serif text-3xl leading-none text-indigo-dark">{item.count}</span>
                    </div>
                    {item.names.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-indigo-dark/10 pt-3 text-xs text-slate-600">
                        {item.names.slice(0, 3).map((name, index) => (
                          <li key={index} className="truncate">
                            {name}
                          </li>
                        ))}
                        {item.names.length > 3 && <li className="text-slate-400">y {item.names.length - 3} más…</li>}
                      </ul>
                    )}
                    <p className="mt-3 inline-flex items-center gap-1 text-xs text-[#7a5f33] group-hover:underline">
                      Abrir <ArrowRight className="h-3 w-3" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* El negocio de un vistazo */}
      <section className="mb-10">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#b08d57]">El negocio de un vistazo</p>
        {stats === null ? (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando datos…
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Link key={kpi.title} href={kpi.href}>
                <Card className="h-full transition-colors hover:border-indigo-dark/30">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.title}</p>
                      <kpi.icon className="h-4 w-4 text-[#b08d57]" />
                    </div>
                    <p className="mt-3 font-serif text-3xl text-indigo-dark">{kpi.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{kpi.subtitle}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Accesos directos */}
      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#b08d57]">Accesos directos</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.label} href={shortcut.href}>
              <Card className="transition-colors hover:border-indigo-dark/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <shortcut.icon className="h-5 w-5 flex-shrink-0 text-[#b08d57]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-indigo-dark">{shortcut.label}</p>
                    <p className="truncate text-xs text-slate-500">{shortcut.hint}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
