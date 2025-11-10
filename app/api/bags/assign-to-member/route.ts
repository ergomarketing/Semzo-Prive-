import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/app/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const { member_id, bag_id } = await request.json()

    if (!member_id || !bag_id) {
      return NextResponse.json({ error: "member_id and bag_id are required" }, { status: 400 })
    }

    const supabase = getSupabaseServiceRole()

    // Verificar que el bolso esté disponible
    const { data: bag, error: bagError } = await supabase.from("bags").select("*").eq("id", bag_id).single()

    if (bagError || !bag) {
      return NextResponse.json({ error: "Bag not found" }, { status: 404 })
    }

    if (bag.status !== "available") {
      return NextResponse.json({ error: "Bag is not available" }, { status: 400 })
    }

    // Actualizar el bolso a rentado y asignar al miembro
    const { error: updateError } = await supabase
      .from("bags")
      .update({
        status: "rented",
        current_member_id: member_id,
      })
      .eq("id", bag_id)

    if (updateError) {
      console.error("[v0] Error updating bag:", updateError)
      return NextResponse.json({ error: "Failed to assign bag" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Bag assigned successfully" })
  } catch (error) {
    console.error("[v0] Error in assign-to-member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
