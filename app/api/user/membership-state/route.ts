import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization token" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("membership_status")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({
        currentPlan: null,
        pendingPlan: null,
        membershipStatus: "free",
        hasActiveSubscription: false,
      })
    }

    const pendingPlan = user.user_metadata?.pending_plan || null
    const membershipStatus = profile?.membership_status || "free"
    const hasActiveSubscription = membershipStatus !== "free"

    return NextResponse.json({
      currentPlan: membershipStatus !== "free" ? membershipStatus : null,
      pendingPlan,
      membershipStatus,
      hasActiveSubscription,
    })
  } catch (error) {
    console.error("Error in membership-state API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
