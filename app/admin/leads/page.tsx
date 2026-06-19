"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw, Users, MailCheck, TrendingUp, UserX, FileText, Send } from "lucide-react"
import Link from "next/link"

interface OpenRates {
  [key: number]: { sent: number; opened: number; rate: number }
}

interface Stats {
  totalLeads: number
  converted: number
  unsubscribed: number
  active: number
  sentToday: number
  sentWeek: number
  openRates: OpenRates
}

interface SourceStat {
  source: string
  label: string
  total: number
  converted: number
  unsubscribed: number
}

const SOURCE_LABELS: Record<string, string> = {
  google_ads:    "Google Ads",
  organic_web:   "Web orgánica",
  social:        "Redes sociales",
  invitation_es: "Invitación ES",
  invitation_en: "Invitación EN",
  referral:      "Referidas",
  manual:        "Manual",
}

interface SequenceRow {
  email_number: number
  status: string
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
}

interface Lead {
  id: string
  email: string
  name: string | null
  source: string
  status: string
  created_at: string
  subscribed_at: string | null
  email_sequence_log: SequenceRow[]
}

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  subscribed: "Socia",
  unsubscribed: "Baja",
  cold: "Fría",
}

const STATUS_COLORS: Record<string, string> = {
  lead: "bg-blue-100 text-blue-800",
  subscribed: "bg-green-100 text-green-800",
  unsubscribed: "bg-red-100 text-red-800",
  cold: "bg-gray-100 text-gray-600",
}

const SEQ_STATUS_COLORS: Record<string, string> = {
  sent: "bg-green-500",
  pending: "bg-yellow-400",
  skipped: "bg-gray-300",
  failed: "bg-red-500",
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#1a1a4b]">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function AdminLeadsPage() {
  const [data, setData] = useState<{ stats: Stats; leads: Lead[]; bySource: SourceStat[]; page: number; hasMore: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("all")

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter)
    const res = await fetch(`/api/admin/leads?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = data?.stats
  const leads = data?.leads || []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
          <h1 className="text-2xl font-bold text-[#1a1a4b]">Automatización de Leads</h1>
          <p className="mt-1 text-sm text-gray-500">Leads de Google Ads · Secuencia de 5 emails</p>
          <Link
            href="/admin/leads/templates"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            Editar plantillas de email
          </Link>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {/* Stats cards */}
        {stats && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total leads" value={stats.totalLeads} />
              <StatCard label="Convertidas" value={stats.converted} sub={`${stats.totalLeads ? Math.round((stats.converted / stats.totalLeads) * 100) : 0}% conversión`} />
              <StatCard label="Activos" value={stats.active} />
              <StatCard label="Bajas" value={stats.unsubscribed} />
            </div>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              <StatCard label="Emails hoy" value={stats.sentToday} />
              <StatCard label="Emails esta semana" value={stats.sentWeek} />
              <div className="rounded-lg border bg-white p-5 md:col-span-1">
                <p className="mb-3 text-xs uppercase tracking-widest text-gray-500">Apertura por email</p>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const r = stats.openRates[n]
                    return (
                      <div key={n} className="flex flex-col items-center gap-1">
                        <div className="relative h-16 w-6 rounded bg-gray-100 overflow-hidden flex items-end">
                          <div
                            className="w-full bg-[#f4c4cc] transition-all"
                            style={{ height: `${r?.rate || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-[#1a1a4b]">E{n}</span>
                        <span className="text-[10px] text-gray-500">{r?.rate || 0}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Leads por fuente */}
        {data?.bySource && data.bySource.length > 0 && (
          <div className="mb-6 rounded-lg border bg-white p-5">
            <p className="mb-4 text-xs uppercase tracking-widest text-gray-500">Leads por canal</p>
            <div className="space-y-2">
              {data.bySource.map((s) => (
                <div key={s.source} className="flex items-center gap-3">
                  <span className="w-32 truncate text-xs text-gray-700">{s.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2">
                    <div
                      className="h-2 rounded-full bg-[#1a1a4b] transition-all"
                      style={{ width: `${data.stats.totalLeads ? Math.round((s.total / data.stats.totalLeads) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-[#1a1a4b]">{s.total}</span>
                  <span className="w-16 text-right text-xs text-green-600">{s.converted} conv.</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros + tabla */}
        <div className="rounded-lg border bg-white">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <p className="text-sm font-medium text-[#1a1a4b]">Leads</p>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="subscribed">Socia</SelectItem>
                <SelectItem value="unsubscribed">Baja</SelectItem>
                <SelectItem value="cold">Fría</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Lead</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Fuente</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Secuencia</th>
                  <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && leads.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Cargando...</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No hay leads</td></tr>
                ) : leads.map((lead) => {
                  const seq = lead.email_sequence_log || []
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#1a1a4b]">{lead.name || "—"}</p>
                        <p className="text-xs text-gray-500">{lead.email}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">{SOURCE_LABELS[lead.source] || lead.source}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[lead.status] || lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((n) => {
                            const row = seq.find((s) => s.email_number === n)
                            const color = row ? (SEQ_STATUS_COLORS[row.status] || "bg-gray-200") : "bg-gray-100"
                            const title = row
                              ? `E${n}: ${row.status}${row.opened_at ? " · abierto" : ""}${row.clicked_at ? " · clic" : ""}`
                              : `E${n}: no programado`
                            return (
                              <div
                                key={n}
                                title={title}
                                className={`h-5 w-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${color}`}
                              >
                                {n}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between border-t px-5 py-3">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="text-xs text-gray-500">Página {page}</span>
            <Button variant="outline" size="sm" disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
