import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError
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
