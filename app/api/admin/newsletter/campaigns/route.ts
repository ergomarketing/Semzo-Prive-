import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PAGE_SIZE = 1000
const MAX_PAGES = 20
const MAX_CAMPAIGNS = 30

interface CampaignRow {
  subject: string
  status: string
  created_at: string
  campaign_id: string | null
  scheduled_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  complained_at: string | null
}

export interface CampaignStats {
  key: string
  subject: string
  date: string
  total: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  pending: number
  complained: number
}

/**
 * GET /api/admin/newsletter/campaigns
 *
 * Estadísticas por campaña a partir de email_logs: enviados, entregados, abiertos,
 * clics y rebotes. Las programadas se agrupan por campaign_id; las enviadas al momento
 * (sin campaign_id) por asunto y día.
 */
export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const campaigns = new Map<string, CampaignStats>()

    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from("email_logs")
        .select(
          "subject, status, created_at, campaign_id:metadata->>campaign_id, scheduled_at:metadata->>scheduled_at, opened_at:metadata->>opened_at, clicked_at:metadata->>clicked_at, bounced_at:metadata->>bounced_at, complained_at:metadata->>complained_at",
        )
        .eq("email_type", "newsletter_campaign")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .returns<CampaignRow[]>()

      if (error) throw error

      for (const row of data ?? []) {
        const key = row.campaign_id ?? `${row.subject}|${row.created_at.slice(0, 10)}`
        let stats = campaigns.get(key)
        if (!stats) {
          stats = {
            key,
            subject: row.subject,
            date: row.scheduled_at ?? row.created_at,
            total: 0,
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: 0,
            failed: 0,
            pending: 0,
            complained: 0,
          }
          campaigns.set(key, stats)
        }

        stats.total++
        if (row.status === "pending") stats.pending++
        else if (row.bounced_at) stats.bounced++
        else if (row.status === "failed") stats.failed++

        if (row.status === "sent" || row.status === "delivered" || row.bounced_at) stats.sent++
        if (row.status === "delivered") stats.delivered++
        if (row.opened_at) stats.opened++
        if (row.clicked_at) stats.clicked++
        if (row.complained_at) stats.complained++
      }

      if ((data?.length ?? 0) < PAGE_SIZE) break
    }

    const list = [...campaigns.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_CAMPAIGNS)
    return NextResponse.json({ campaigns: list })
  } catch (error) {
    console.error("[newsletter/campaigns] Error:", error)
    return NextResponse.json({ error: "No se pudieron cargar las estadísticas", campaigns: [] }, { status: 500 })
  }
}
