import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey =
      process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: profile } = await supabase
      .from("profiles")
      .select("membership_status, membership_type, subscription_end_date")
      .eq("id", userId)
      .single()

    if (!profile) {
      return NextResponse.json({ hasActiveMembership: false })
    }

    const hasActiveMembership =
      profile.membership_status === "active" &&
      profile.membership_type &&
      profile.membership_type !== "free" &&
      profile.subscription_end_date &&
      new Date(profile.subscription_end_date) > new Date()

    return NextResponse.json({
      hasActiveMembership,
      membershipType: profile.membership_type,
      endDate: profile.subscription_end_date,
    })
  } catch (error) {
    console.error("Error checking membership status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
