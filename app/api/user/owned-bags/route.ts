import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Bolsos completados por la socia (compra finalizada)
    const { data: completed, error } = await supabase
      .from("ownership_progress")
      .select("id, bag_id, purchase_price, accumulated, completed_at, started_at")
      .eq("user_id", user.id)
      .eq("mode", "collect")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("[v0] owned-bags query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!completed || completed.length === 0) {
      return NextResponse.json({ bags: [] })
    }

    const bagIds = completed.map((c) => c.bag_id)
    const { data: bags } = await supabase
      .from("bags")
      .select("id, name, brand, model, images, authenticity_certificate_url")
      .in("id", bagIds)

    const bagMap = new Map((bags || []).map((b) => [b.id, b]))

    const result = completed.map((c) => {
      const bag = bagMap.get(c.bag_id)
      const images = Array.isArray(bag?.images) ? bag?.images : []
      return {
        id: c.id,
        bag_id: c.bag_id,
        name: bag?.name || "",
        brand: bag?.brand || "",
        model: bag?.model || "",
        image_url: images[0]?.url || images[0] || null,
        purchase_price: c.purchase_price != null ? Number(c.purchase_price) : null,
        paid_total: c.accumulated != null ? Number(c.accumulated) : null,
        completed_at: c.completed_at,
        started_at: c.started_at,
        authenticity_certificate_url: bag?.authenticity_certificate_url || null,
      }
    })

    return NextResponse.json({ bags: result })
  } catch (err) {
    console.error("[v0] owned-bags error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
