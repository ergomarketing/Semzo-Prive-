import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/admin/members - Starting request")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("[v0] Fetching profiles from Supabase...")

    // Obtener todos los perfiles de usuarios
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.log("[v0] Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Error al obtener miembros", details: profilesError }, { status: 500 })
    }

    console.log("[v0] Found profiles:", profiles?.length || 0, profiles)

    // Transformar datos para el formato esperado por el frontend
    const members =
      profiles?.map((profile) => ({
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario",
        email: profile.email,
        phone: profile.shipping_phone || "No disponible",
        membership: profile.member_type || "free",
        joinDate: profile.created_at,
        status: profile.membership_status || "active",
        currentBag: null,
        totalRentals: 0,
        shippingAddress: profile.shipping_address,
        shippingCity: profile.shipping_city,
        shippingPostalCode: profile.shipping_postal_code,
        shippingCountry: profile.shipping_country,
      })) || []

    console.log("[v0] Returning members:", members.length, members)

    return NextResponse.json({
      members,
      total: members.length,
      stats: {
        total: members.length,
        signature: members.filter((m) => m.membership === "signature").length,
        prive: members.filter((m) => m.membership === "prive").length,
        essentiel: members.filter((m) => m.membership === "essentiel").length,
        free: members.filter((m) => m.membership === "free").length,
        active: members.filter((m) => m.status === "active").length,
      },
    })
  } catch (error) {
    console.error("[v0] Error in admin members API:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error }, { status: 500 })
  }
}
