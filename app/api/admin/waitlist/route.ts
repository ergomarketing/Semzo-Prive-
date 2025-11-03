import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function GET() {
  try {
    const { data: waitlist, error } = await supabase
      .from("waitlist")
      .select("*, bags(name, brand, status)")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ waitlist })
  } catch (error) {
    console.error("Error fetching waitlist:", error)
    return NextResponse.json({ error: "Error al obtener lista de espera" }, { status: 500 })
  }
}
