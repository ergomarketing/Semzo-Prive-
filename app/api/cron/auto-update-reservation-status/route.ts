import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function GET() {
  try {
    const now = new Date()

    const { data: toActivate } = await supabase
      .from("reservations")
      .select("*")
      .eq("status", "confirmed")
      .lt("start_date", now.toISOString())

    if (toActivate && toActivate.length > 0) {
      await supabase
        .from("reservations")
        .update({ status: "active", updated_at: now.toISOString() })
        .in(
          "id",
          toActivate.map((r) => r.id),
        )

      for (const reservation of toActivate) {
        await supabase.from("audit_logs").insert({
          user_id: "system",
          action: "reservation_auto_activated",
          entity_type: "reservation",
          entity_id: reservation.id,
          old_data: { status: "confirmed" },
          new_data: { status: "active" },
          created_at: now.toISOString(),
        })
      }
    }

    const { data: toComplete } = await supabase
      .from("reservations")
      .select("*")
      .eq("status", "active")
      .lt("end_date", now.toISOString())

    if (toComplete && toComplete.length > 0) {
      await supabase
        .from("reservations")
        .update({ status: "completed", updated_at: now.toISOString() })
        .in(
          "id",
          toComplete.map((r) => r.id),
        )

      for (const reservation of toComplete) {
        await supabase.from("bags").update({ status: "available" }).eq("id", reservation.bag_id)

        await supabase.from("audit_logs").insert({
          user_id: "system",
          action: "reservation_auto_completed",
          entity_type: "reservation",
          entity_id: reservation.id,
          old_data: { status: "active" },
          new_data: { status: "completed" },
          created_at: now.toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      activated: toActivate?.length || 0,
      completed: toComplete?.length || 0,
    })
  } catch (error) {
    console.error("Error auto-updating reservations:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
