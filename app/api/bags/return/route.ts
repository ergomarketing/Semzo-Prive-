import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/app/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const { bag_id } = await request.json()

    if (!bag_id) {
      return NextResponse.json({ error: "bag_id is required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceRole()

    // Actualizar el bolso a disponible
    const { error: updateError } = await supabase
      .from("bags")
      .update({
        status: "available",
        current_member_id: null,
      })
      .eq("id", bag_id)

    if (updateError) {
      console.error("[v0] Error returning bag:", updateError)
      return NextResponse.json({ error: "Failed to return bag" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Bag returned successfully" })
  } catch (error) {
    console.error("[v0] Error in return:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
