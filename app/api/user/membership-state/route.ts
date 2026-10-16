import { type NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "../../../lib/supabase"

// Estados de user_memberships en los que la socia cuenta como miembro. Los
// pendientes de verificacion y los cancelados devuelven "free".
const MEMBERSHIP_WITH_ACCESS_STATUSES = ["active", "cancelled_active", "past_due", "paused", "limited_access"]

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No authorization token" }, { status: 401 })
    }

    if (!supabase || !supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const token = authHeader.split(" ")[1]
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("user_memberships")
      .select("membership_type, status")
      .eq("user_id", user.id)
      .maybeSingle()

    if (membershipError) {
      console.error("Error fetching membership:", membershipError)
      return NextResponse.json({
        currentPlan: null,
        pendingPlan: null,
        membershipStatus: "free",
        hasActiveSubscription: false,
      })
    }

    const pendingPlan = user.user_metadata?.pending_plan || null
    const membershipStatus =
      membership?.membership_type && MEMBERSHIP_WITH_ACCESS_STATUSES.includes(membership.status)
        ? membership.membership_type
        : "free"
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
