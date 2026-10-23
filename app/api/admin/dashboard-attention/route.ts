import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { isReturnWindowOpen } from "@/lib/return-window"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

type Item = { key: string; title: string; hint: string; count: number; href: string; tone: "rose" | "gold" | "slate"; names: string[] }

const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null))
const label = (member: any, bag: any) => {
  const who = member?.full_name || member?.email || "—"
  const what = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : ""
  return what ? `${who} · ${what}` : who
}

/**
 * GET /api/admin/dashboard-attention
 * Lo que necesita a Erika HOY: devoluciones vencidas o en camino, recogidas por confirmar, envios por crear,
 * pagos pendientes, verificaciones, cargos SEPA sin resolver, correos fallidos y avisos sin leer.
 * Solo muestra lo que tiene algo pendiente.
 */
export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [overdueRes, legsRes, pickupsRes, confirmedRes, pastDueRes, verifyRes, sepaRes, emailsRes, alertsRes, queuedRes] =
      await Promise.all([
        supabase
          .from("reservations")
          .select("id, end_date, profiles!reservations_user_id_fkey(full_name,email), bags!reservations_bag_id_fkey(name,brand)")
          .eq("status", "overdue")
          .order("end_date", { ascending: true }),
        supabase
          .from("shipments")
          .select(
            "id, return_status, reservations!shipments_reservation_id_fkey(id, status, end_date, profiles!reservations_user_id_fkey(full_name,email), bags!reservations_bag_id_fkey(name,brand))",
          )
          .not("return_tracking_number", "is", null),
        supabase
          .from("returns")
          .select(
            "id, shipments!returns_shipment_id_fkey(pickup_confirmed_at, reservations!shipments_reservation_id_fkey(status, profiles!reservations_user_id_fkey(full_name,email), bags!reservations_bag_id_fkey(name,brand)))",
          )
          .eq("return_carrier", "pickup")
          .neq("status", "cancelled"),
        supabase
          .from("reservations")
          .select("id, profiles!reservations_user_id_fkey(full_name,email), bags!reservations_bag_id_fkey(name,brand)")
          .eq("status", "confirmed"),
        supabase
          .from("user_memberships")
          .select("user_id")
          .eq("status", "past_due"),
        supabase
          .from("user_memberships")
          .select("user_id")
          .in("status", ["pending_verification", "paid_pending_verification", "limited_access"]),
        supabase
          .from("reservations")
          .select("id, profiles!reservations_user_id_fkey(full_name,email), bags!reservations_bag_id_fkey(name,brand)")
          .not("sepa_charge_failed_at", "is", null)
          .is("sepa_manual_paid_at", null)
          .is("sepa_charged_at", null),
        supabase.from("email_logs").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", weekAgo),
        supabase.from("admin_notifications").select("id", { count: "exact", head: true }).eq("read", false),
        supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "queued"),
      ])

    // Devoluciones que pueden estar volviendo (ventana de devolucion) o ya entregadas por Correos y sin verificar.
    const legs = (legsRes.data || [])
      .map((row: any) => ({ row, reservation: one<any>(row.reservations) }))
      .filter(({ row, reservation }) => {
        if (!reservation || !["active", "overdue", "confirmed"].includes(reservation.status)) return false
        return row.return_status === "delivered" || isReturnWindowOpen(reservation.end_date, reservation.status)
      })
      .map(({ reservation }) => label(one(reservation.profiles), one(reservation.bags)))

    // Recogidas por confirmar.
    const pickups = (pickupsRes.data || [])
      .map((row: any) => {
        const shipment = one<any>(row.shipments)
        const reservation = one<any>(shipment?.reservations)
        return { shipment, reservation }
      })
      .filter(({ shipment, reservation }) => shipment && !shipment.pickup_confirmed_at && ["active", "overdue", "confirmed"].includes(reservation?.status || ""))
      .map(({ reservation }) => label(one(reservation.profiles), one(reservation.bags)))

    // Reservas confirmadas sin envio creado.
    const confirmed = confirmedRes.data || []
    let toShip: string[] = []
    if (confirmed.length > 0) {
      const { data: shipped } = await supabase
        .from("shipments")
        .select("reservation_id")
        .in("reservation_id", confirmed.map((r: any) => r.id))
        .neq("status", "cancelled")
      const shippedIds = new Set((shipped || []).map((s: any) => s.reservation_id))
      toShip = confirmed.filter((r: any) => !shippedIds.has(r.id)).map((r: any) => label(one(r.profiles), one(r.bags)))
    }

    // Nombres de las socias de una lista de membresias (sin depender de una relacion entre tablas).
    const memberNames = async (rows: any[] | null): Promise<string[]> => {
      const ids = Array.from(new Set((rows || []).map((r: any) => r.user_id)))
      if (ids.length === 0) return []
      const { data } = await supabase.from("profiles").select("full_name, email").in("id", ids)
      return (data || []).map((p: any) => p.full_name || p.email || "—")
    }
    const [pastDueNames, verifyNames] = await Promise.all([memberNames(pastDueRes.data), memberNames(verifyRes.data)])

    const items: Item[] = [
      {
        key: "overdue",
        title: "Devoluciones vencidas",
        hint: "La socia no ha devuelto el bolso a tiempo",
        count: (overdueRes.data || []).length,
        href: "/admin/logistics",
        tone: "rose",
        names: (overdueRes.data || []).map((r: any) => label(one(r.profiles), one(r.bags))),
      },
      {
        key: "sepa",
        title: "Cargos SEPA sin resolver",
        hint: "El cargo por no devolución falló y no está pagado",
        count: (sepaRes.data || []).length,
        href: "/admin/reservations",
        tone: "rose",
        names: (sepaRes.data || []).map((r: any) => label(one(r.profiles), one(r.bags))),
      },
      {
        key: "past_due",
        title: "Pagos pendientes",
        hint: "Membresías con el cobro sin pasar",
        count: pastDueNames.length,
        href: "/admin/members",
        tone: "rose",
        names: pastDueNames,
      },
      {
        key: "to_ship",
        title: "Envíos por crear",
        hint: "Reservas confirmadas que aún no tienen etiqueta",
        count: toShip.length,
        href: "/admin/logistics",
        tone: "gold",
        names: toShip,
      },
      {
        key: "returns",
        title: "Devoluciones en camino",
        hint: "Bolsos que vuelven: pulsa «Recibida y verificada» al recibirlos",
        count: legs.length,
        href: "/admin/logistics",
        tone: "gold",
        names: legs,
      },
      {
        key: "pickups",
        title: "Recogidas por confirmar",
        hint: "Pídelas en Correos y avisa a la socia",
        count: pickups.length,
        href: "/admin/logistics",
        tone: "gold",
        names: pickups,
      },
      {
        key: "verify",
        title: "Verificaciones de identidad",
        hint: "Socias sin identidad verificada",
        count: verifyNames.length,
        href: "/admin/members",
        tone: "slate",
        names: verifyNames,
      },
      {
        key: "alerts",
        title: "Avisos sin leer",
        hint: "Notificaciones del sistema",
        count: alertsRes.count || 0,
        href: "/admin/alerts",
        tone: "slate",
        names: [],
      },
      {
        key: "emails",
        title: "Correos fallidos (7 días)",
        hint: "No se pudieron enviar",
        count: emailsRes.count || 0,
        href: "/admin/email-logs",
        tone: "slate",
        names: [],
      },
      {
        key: "queued",
        title: "Próximos bolsos en cola",
        hint: "Saldrán al recibir la devolución actual",
        count: queuedRes.count || 0,
        href: "/admin/reservations",
        tone: "slate",
        names: [],
      },
    ].filter((item) => item.count > 0) as Item[]

    return NextResponse.json({ items })
  } catch (error) {
    console.error("[admin/dashboard-attention] error:", error)
    return NextResponse.json({ error: "No se pudo cargar lo pendiente" }, { status: 500 })
  }
}
