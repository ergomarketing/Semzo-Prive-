import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PAGE_SIZE = 1000
const MAX_PAGES = 30
const ALLOWED_DAYS = [7, 30, 90, 365]

interface Row {
  email_type: string
  status: string
  recipient_email: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  complained_at: string | null
}

export interface EmailTypeStats {
  type: string
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

// Cuentas de prueba: no cuentan en las metricas (mismo criterio que Klaviyo).
const TEST_RECIPIENT = /^ergomara\d|@phone\.semzopriv/i

/**
 * GET /api/admin/email-logs/by-type?days=30
 *
 * Resumen de envios por tipo de correo (secuencias de leads, avisos de renovacion, transaccionales...):
 * enviados, entregados, abiertos, clics y rebotes. Las newsletters se excluyen porque ya tienen su tabla
 * "Resultados por campania". Los tipos de prueba (terminan en "_test") y las cuentas de prueba no cuentan.
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const requested = Number.parseInt(request.nextUrl.searchParams.get("days") || "30", 10)
    const days = ALLOWED_DAYS.includes(requested) ? requested : 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const byType = new Map<string, EmailTypeStats>()

    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from("email_logs")
        .select(
          "email_type, status, recipient_email, opened_at:metadata->>opened_at, clicked_at:metadata->>clicked_at, bounced_at:metadata->>bounced_at, complained_at:metadata->>complained_at",
        )
        .neq("email_type", "newsletter_campaign")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        .returns<Row[]>()

      if (error) throw error

      for (const row of data ?? []) {
        if (!row.email_type || row.email_type.endsWith("_test")) continue
        if (row.recipient_email && TEST_RECIPIENT.test(row.recipient_email)) continue

        let stats = byType.get(row.email_type)
        if (!stats) {
          stats = { type: row.email_type, total: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0, pending: 0, complained: 0 }
          byType.set(row.email_type, stats)
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

    const types = [...byType.values()].sort((a, b) => b.total - a.total)
    return NextResponse.json({ days, types })
  } catch (error) {
    console.error("[email-logs/by-type] Error:", error)
    return NextResponse.json({ error: "No se pudieron cargar las estadísticas", types: [] }, { status: 500 })
  }
}
