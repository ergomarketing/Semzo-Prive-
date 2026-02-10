import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    const supabase = await createClient()

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
        console.log("[v0] Email logs table not created yet, returning empty data")
        return NextResponse.json({
          logs: [],
          stats: { total: 0, sent: 0, failed: 0, pending: 0 },
        })
      }
      console.error("[v0] Error fetching email logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate stats
    const { data: allLogs, error: statsError } = await supabase.from("email_logs").select("status")

    if (statsError) {
      return NextResponse.json({
        logs: logs || [],
        stats: { total: 0, sent: 0, failed: 0, pending: 0 },
      })
    }

    const stats = {
      total: allLogs?.length || 0,
      sent: allLogs?.filter((l) => l.status === "sent").length || 0,
      failed: allLogs?.filter((l) => l.status === "failed").length || 0,
      pending: allLogs?.filter((l) => l.status === "pending").length || 0,
    }

    return NextResponse.json({ logs, stats })
  } catch (error) {
    console.error("[v0] Exception in email-logs API:", error)
    return NextResponse.json(
      {
        logs: [],
        stats: { total: 0, sent: 0, failed: 0, pending: 0 },
      },
      { status: 200 },
    )
  }
}
