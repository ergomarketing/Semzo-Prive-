import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabaseClient"

export async function POST(request: NextRequest) {
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

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        pending_plan: planId,
        plan_selected_at: new Date().toISOString(),
      },
    })

    if (updateError) {
      console.error("Error storing pending plan:", updateError)
      return NextResponse.json({ error: "Failed to store pending plan" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in store-pending-plan API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
