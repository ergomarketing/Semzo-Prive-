import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const supabase = getServiceClient()

    let query = supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(limit)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (type && type !== "all") {
      query = query.eq("email_type", type)
    }

    const { data: logs, error } = await query

    if (error) {
      if (error.message.includes("does not exist")) {
        return NextResponse.json({
          logs: [],
          stats: { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 },
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const countByStatus = async (statusFilter?: string) => {
      let countQuery = supabase.from("email_logs").select("id", { count: "exact", head: true })
      if (statusFilter) countQuery = countQuery.eq("status", statusFilter)
      const { count } = await countQuery
      return count ?? 0
    }

    const [total, sent, delivered, failed, pending] = await Promise.all([
      countByStatus(),
      countByStatus("sent"),
      countByStatus("delivered"),
      countByStatus("failed"),
      countByStatus("pending"),
    ])

    return NextResponse.json({ logs, stats: { total, sent, delivered, failed, pending } })
  } catch (error) {
    return NextResponse.json(
      {
        logs: [],
        stats: { total: 0, sent: 0, failed: 0, pending: 0 },
      },
      { status: 200 },
    )
  }
}
