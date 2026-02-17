import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { selectedPlan } = await request.json()

    if (!selectedPlan) {
      return NextResponse.json({ error: "Plan selection required" }, { status: 400 })
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        pending_plan: selectedPlan,
        plan_selected_at: new Date().toISOString(),
      },
    })

    if (error) {
      console.error("Error storing plan selection:", error)
      return NextResponse.json({ error: "Failed to store plan selection" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in store-plan-selection API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
