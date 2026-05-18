import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    const [reservationsRes, passesRes] = await Promise.all([
      supabase
        .from("reservations")
        .select(`id, created_at, status, start_date, end_date, bags(name, brand)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("bag_passes")
        .select("id, pass_tier, status, price, purchased_at, stripe_session_id")
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false }),
    ])

    if (reservationsRes.error) {
      console.error("[v0] Error fetching history reservations:", reservationsRes.error)
    }
    if (passesRes.error) {
      console.error("[v0] Error fetching history passes:", passesRes.error)
    }

    const reservations =
      reservationsRes.data?.map((r: any) => ({
        id: r.id,
        created_at: r.created_at,
        status: r.status,
        start_date: r.start_date,
        end_date: r.end_date,
        bag_name: r.bags?.name || "Bolso",
        bag_brand: r.bags?.brand || "",
      })) || []

    const passes =
      passesRes.data?.map((p: any) => ({
        id: p.id,
        pass_tier: p.pass_tier,
        status: p.status,
        price: typeof p.price === "string" ? Number.parseFloat(p.price) : p.price,
        purchased_at: p.purchased_at,
        stripe_session_id: p.stripe_session_id,
      })) || []

    return NextResponse.json({ reservations, passes })
  } catch (error) {
    console.error("[v0] Error in history API:", error)
    return NextResponse.json({ reservations: [], passes: [] })
  }
}
