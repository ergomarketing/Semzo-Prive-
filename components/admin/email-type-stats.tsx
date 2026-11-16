"use client"

import { useState } from "react"
import useSWR from "swr"
import { ListChecks, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/panel/card"
import type { EmailTypeStats as EmailTypeRow } from "@/app/api/admin/email-logs/by-type/route"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

const PERIODS = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 365, label: "1 año" },
]

/** Nombres claros para los tipos de correo; los que no estan aqui se muestran tal cual. */
const LABELS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^lead_sequence_(\d)$/, (m) => `Secuencia de leads · correo ${m[1]}`],
  [/^checkout_abandoned_(\d)$/, (m) => `Carrito abandonado · correo ${m[1]}`],
  [/^winback_(\d)$/, (m) => `Recuperación de socias · correo ${m[1]}`],
  [/^renewal_reminder_(\d)$/, (m) => `Aviso de renovación de membresía · ${m[1]}`],
  [/^membership_onboarding_(\d)$/, (m) => `Bienvenida de socia · correo ${m[1]}`],
  [/^pause_reactivation_(\d)$/, (m) => `Reactivación tras pausa · correo ${m[1]}`],
  [/^nps_(\d)$/, () => "Encuesta de satisfacción"],
  [/^user_registration$/, () => "Registro de usuaria"],
  [/^membership_activated$/, () => "Membresía activada (socia)"],
  [/^admin_membership_activated$/, () => "Membresía activada (aviso admin)"],
  [/^membership_renewed$/, () => "Membresía renovada"],
  [/^payment_failed$/, () => "Pago fallido"],
  [/^dunning_e(\d)$/, (m) => `Reintento de cobro · correo ${m[1]}`],
  [/^shipment_status$/, () => "Estado del envío"],
  [/^bag_updated$/, () => "Bolso actualizado / reservado"],
  [/^bag_added$/, () => "Bolso añadido"],
  [/^return_reminder$/, () => "Recordatorio de devolución"],
  [/^return_label_reminder_manual$/, () => "Recordatorio de etiqueta de devolución"],
  [/^identity_verified$/, () => "Identidad verificada"],
  [/^colecciona_renewal_(\w+)$/, (m) => `Colecciona · renovación de pase (${m[1]})`],
  [/^colecciona_sale_member$/, () => "Colecciona · venta (socia)"],
  [/^colecciona_sale_admin$/, () => "Colecciona · venta (aviso admin)"],
  [/^ownership_ready_to_finalize$/, () => "Colecciona · listo para finalizar"],
  [/^reservation_cancelled$/, () => "Reserva cancelada"],
  [/^pickup_confirmed$/, () => "Recogida confirmada"],
  [/^contact_form$/, () => "Formulario de contacto"],
  [/^newsletter_subscription$/, () => "Alta en newsletter"],
  [/^suspicious_address_change$/, () => "Cambio de dirección sospechoso"],
]

function labelFor(type: string): string {
  for (const [pattern, build] of LABELS) {
    const match = type.match(pattern)
    if (match) return build(match)
  }
  return type
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

export function EmailTypeStats() {
  const [days, setDays] = useState(30)
  const { data, error, isLoading, mutate, isValidating } = useSWR<{ types: EmailTypeRow[] }>(
    `/api/admin/email-logs/by-type?days=${days}`,
    fetcher,
  )
  const types = data?.types ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center">
            <ListChecks className="mr-2 h-5 w-5" />
            Resultados por tipo de correo
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="inline-flex overflow-hidden rounded-md border border-slate-200 text-sm">
              {PERIODS.map((period) => (
                <button
                  key={period.days}
                  type="button"
                  onClick={() => setDays(period.days)}
                  className={`px-3 py-1 ${days === period.days ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {period.label}
                </button>
              ))}
            </div>
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
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Correos automáticos y transaccionales (sin newsletters ni cuentas de prueba). Las aperturas se inflan porque
          algunos clientes de correo abren el mensaje solos: fíate más de los clics.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-6 text-center text-sm text-slate-600">Cargando...</p>
        ) : error || data?.types === undefined || types.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-600">
            {error || data?.types === undefined ? "No se pudieron cargar las estadísticas." : "No hay envíos en este periodo."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="py-2 pr-4 text-left font-medium">Tipo de correo</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Enviados</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Entregados</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Abiertos</th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">Clics</th>
                  <th scope="col" className="py-2 pl-2 text-right font-medium">Rebotes</th>
                </tr>
              </thead>
              <tbody>
                {types.map((row) => (
                  <tr key={row.type} className="border-b border-slate-100 align-top last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{labelFor(row.type)}</p>
                      <p className="text-xs text-slate-500">
                        {row.type} · {row.total} envíos
                        {row.pending > 0 && ` · ${row.pending} pendientes`}
                        {row.failed > 0 && ` · ${row.failed} fallidos`}
                        {row.complained > 0 && ` · ${row.complained} quejas`}
                      </p>
                    </td>
                    <td className="px-2 py-3"><Metric value={row.sent} base={row.total} /></td>
                    <td className="px-2 py-3"><Metric value={row.delivered} base={row.sent} /></td>
                    <td className="px-2 py-3"><Metric value={row.opened} base={row.delivered} /></td>
                    <td className="px-2 py-3"><Metric value={row.clicked} base={row.delivered} /></td>
                    <td className="py-3 pl-2"><Metric value={row.bounced} base={row.sent} /></td>
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
