import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const supabase = getServiceClient()

    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")
    const action = url.searchParams.get("action")
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")

    let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (action) {
      query = query.eq("action", action)
    }

    const { data: logs, error } = await query

    if (error) throw error

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
