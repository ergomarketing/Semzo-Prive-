import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PAGE_SIZE = 1000
const MAX_PAGES = 20

interface ScheduledCampaign {
  campaign_id: string
  subject: string
  scheduled_at: string
  recipients: number
}

/**
 * GET /api/admin/newsletter/scheduled
 *
 * Campañas de newsletter programadas que aún no han llegado a su hora de envío
 * (filas de email_logs con status "pending" y campaign_id en metadata).
 */
export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const nowIso = new Date().toISOString()
    const campaigns = new Map<string, ScheduledCampaign>()

    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from("email_logs")
        .select("subject, metadata")
        .eq("email_type", "newsletter_campaign")
        .eq("status", "pending")
        .gt("metadata->>scheduled_at", nowIso)
        .order("created_at", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error

      for (const row of data ?? []) {
        const meta = (row.metadata ?? {}) as { campaign_id?: string; scheduled_at?: string }
        if (!meta.campaign_id || !meta.scheduled_at) continue
        const existing = campaigns.get(meta.campaign_id)
        if (existing) {
          existing.recipients++
        } else {
          campaigns.set(meta.campaign_id, {
            campaign_id: meta.campaign_id,
            subject: row.subject,
            scheduled_at: meta.scheduled_at,
            recipients: 1,
          })
        }
      }

      if ((data?.length ?? 0) < PAGE_SIZE) break
    }

    const list = [...campaigns.values()].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    return NextResponse.json({ campaigns: list })
  } catch (error) {
    console.error("[newsletter/scheduled] Error:", error)
    return NextResponse.json({ error: "No se pudieron cargar las campañas programadas", campaigns: [] }, { status: 500 })
  }
}
