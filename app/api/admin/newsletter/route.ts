import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_SUPABASE_URL

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] ❌ Supabase configuration missing")
      return NextResponse.json({ error: "Configuración del servidor incorrecta", subscribers: [] }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: subscribers, error } = await supabase
      .from("newsletter_subscriptions")
      .select("*")
      .order("subscribed_at", { ascending: false })

    if (error) {
      console.error("[v0] ❌ Error fetching subscribers:", error.message)
      throw error
    }

    console.log("[v0] ✅ Subscribers loaded:", subscribers?.length || 0)
    return NextResponse.json({ subscribers: subscribers || [] })
  } catch (error: any) {
    console.error("[v0] ❌ Error fetching subscribers:", error)
    return NextResponse.json({ error: "Failed to fetch subscribers", subscribers: [] }, { status: 500 })
  }
}
