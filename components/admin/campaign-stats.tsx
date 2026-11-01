"use client"

import useSWR from "swr"
import { BarChart3, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/panel/card"
import type { CampaignStats as CampaignStatsRow } from "@/app/api/admin/newsletter/campaigns/route"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Metric({ value, base }: { value: number; base: number }) {
  const percent = base > 0 ? Math.round((value / base) * 100) : 0
  return (
    <div className="text-right tabular-nums">
      <span className="font-medium text-slate-900">{value}</span>
      {value > 0 && base > 0 && <span className="ml-1 text-xs text-slate-500">{percent}%</span>}
    </div>
  )
}

export function CampaignStats() {
  const { data, error, isLoading, mutate, isValidating } = useSWR<{ campaigns: CampaignStatsRow[] }>(
    "/api/admin/newsletter/campaigns",
    fetcher,
  )
  const campaigns = data?.campaigns ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Resultados por campaña
          </CardTitle>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-6 text-center text-sm text-slate-600">Cargando campañas...</p>
        ) : error || campaigns.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-600">
            {error ? "No se pudieron cargar las estadísticas." : "Todavía no hay campañas enviadas."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="py-2 pr-4 text-left font-medium">Campaña</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Enviados</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Entregados</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Abiertos</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Clics</th>
                  <th scope="col" className="py-2 pl-2 text-right font-medium">Rebotes</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.key} className="border-b border-slate-100 align-top last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{campaign.subject}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(campaign.date)} · {campaign.total} destinatarios
                        {campaign.pending > 0 && ` · ${campaign.pending} pendientes`}
                        {campaign.failed > 0 && ` · ${campaign.failed} fallidos`}
                        {campaign.complained > 0 && ` · ${campaign.complained} quejas`}
                      </p>
                    </td>
                    <td className="px-2 py-3"><Metric value={campaign.sent} base={campaign.total} /></td>
                    <td className="px-2 py-3"><Metric value={campaign.delivered} base={campaign.sent} /></td>
                    <td className="px-2 py-3"><Metric value={campaign.opened} base={campaign.delivered} /></td>
                    <td className="px-2 py-3"><Metric value={campaign.clicked} base={campaign.delivered} /></td>
                    <td className="py-3 pl-2"><Metric value={campaign.bounced} base={campaign.sent} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
