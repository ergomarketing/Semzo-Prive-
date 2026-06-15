import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = 20
  const offset = (page - 1) * limit
  const status = searchParams.get("status") || ""

  // Stats globales
  const [
    { count: totalLeads },
    { count: converted },
    { count: unsubscribed },
    { data: emailStats },
    { data: sentToday },
    { data: sentWeek },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "subscribed"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "unsubscribed"),
    // Tasa de apertura por número de email
    supabase.from("email_sequence_log").select("email_number, status, opened_at").eq("status", "sent"),
    // Enviados hoy
    supabase
      .from("email_sequence_log")
      .select("id", { count: "exact", head: false })
      .eq("status", "sent")
      .gte("sent_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    // Enviados esta semana
    supabase
      .from("email_sequence_log")
      .select("id", { count: "exact", head: false })
      .eq("status", "sent")
      .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  // Calcular tasa de apertura por email
  const openRates: Record<number, { sent: number; opened: number; rate: number }> = {}
  for (let i = 1; i <= 5; i++) {
    const rows = (emailStats || []).filter((r) => r.email_number === i)
    const opened = rows.filter((r) => r.opened_at).length
    openRates[i] = { sent: rows.length, opened, rate: rows.length ? Math.round((opened / rows.length) * 100) : 0 }
  }

  // Lista paginada de leads
  let query = supabase
    .from("leads")
    .select(`*, email_sequence_log(email_number, status, sent_at, opened_at, clicked_at)`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq("status", status)

  const { data: leads, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    stats: {
      totalLeads,
      converted,
      unsubscribed,
      active: (totalLeads || 0) - (converted || 0) - (unsubscribed || 0),
      sentToday: sentToday?.length || 0,
      sentWeek: sentWeek?.length || 0,
      openRates,
    },
    leads,
    page,
    hasMore: (leads?.length || 0) === limit,
  })
}
