import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("invitation_registrations")
      .select("id, nombre, email, whatsapp, codigo_descuento, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[admin/invitation-registrations] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ registrations: data || [] })
  } catch (error) {
    console.error("[admin/invitation-registrations] Unexpected error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
