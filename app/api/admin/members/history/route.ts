import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id,
        created_at,
        status,
        start_date,
        end_date,
        bags(name, brand)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching history:", error)
      return NextResponse.json({ reservations: [] })
    }

    const reservations =
      data?.map((r: any) => ({
        id: r.id,
        created_at: r.created_at,
        status: r.status,
        start_date: r.start_date,
        end_date: r.end_date,
        bag_name: r.bags?.name || "Bolso",
        bag_brand: r.bags?.brand || "",
      })) || []

    return NextResponse.json({ reservations })
  } catch (error) {
    console.error("Error in history API:", error)
    return NextResponse.json({ reservations: [] })
  }
}
