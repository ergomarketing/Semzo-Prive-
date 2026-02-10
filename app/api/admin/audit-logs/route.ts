import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

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
