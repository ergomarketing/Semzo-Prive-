import { NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/app/lib/supabaseClient"

export async function GET() {
  console.log("[v0] GET /api/admin/members - Starting request")

  try {
    const supabase = getSupabaseServiceRole()

    console.log("[v0] Fetching profiles from Supabase...")
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching profiles:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Found profiles:", profiles?.length, JSON.stringify(profiles).slice(0, 500) + "...")

    const members =
      profiles?.map((profile) => ({
        id: profile.id,
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Sin nombre",
        email: profile.email,
        phone: profile.phone || "No disponible",
        membership: profile.membership_status === "free" ? "FREE" : profile.membership_status?.toUpperCase() || "FREE",
        joinDate: profile.created_at,
        status: profile.membership_status === "free" ? "free" : "Activo",
        currentBag: null,
        totalRentals: 0,
        shippingAddress: profile.shipping_address,
        shippingCity: profile.shipping_city,
        shippingPostalCode: profile.shipping_postal_code,
        shippingCountry: profile.shipping_country,
      })) || []

    console.log("[v0] Returning members:", members.length, JSON.stringify(members).slice(0, 500) + "...")

    return NextResponse.json({ members })
  } catch (error) {
    console.error("[v0] Error in members API:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}
