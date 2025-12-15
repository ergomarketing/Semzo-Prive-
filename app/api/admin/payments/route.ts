import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        profiles(full_name, email),
        reservations(
          id,
          start_date,
          end_date,
          bags(name, brand)
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json([])
  }
}
