import { NextResponse } from "next/server"
import { supabase } from "@/app/lib/supabaseClient"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ subscribers: subscribers || [] })
  } catch (error) {
    console.error("Error fetching subscribers:", error)
    return NextResponse.json({ error: "Failed to fetch subscribers", subscribers: [] }, { status: 500 })
  }
}
