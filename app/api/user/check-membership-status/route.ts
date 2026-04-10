import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Leer de user_memberships (FUENTE DE VERDAD)
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("status, membership_type, end_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json({ hasActiveMembership: false })
    }

    const hasActiveMembership =
      membership.status === "active" &&
      membership.membership_type &&
      membership.membership_type !== "free" &&
      membership.end_date &&
      new Date(membership.end_date) > new Date()

    return NextResponse.json({
      hasActiveMembership,
      membershipType: membership.membership_type,
      endDate: membership.end_date,
    })
  } catch (error) {
    console.error("Error checking membership status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
