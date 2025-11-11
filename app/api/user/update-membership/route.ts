import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipType, paymentId } = await request.json()

    if (!userId || !membershipType || !paymentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        membership_status: membershipType,
        payment_id: paymentId,
        membership_updated_at: new Date().toISOString(),
      },
    })

    if (error) {
      console.error("Error updating membership:", error)
      return NextResponse.json({ error: "Failed to update membership" }, { status: 500 })
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      membership_type: membershipType,
      payment_id: paymentId,
      membership_active: true,
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Error updating profile:", profileError)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in update-membership API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
