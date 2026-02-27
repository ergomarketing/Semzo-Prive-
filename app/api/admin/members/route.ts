import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/admin/members - Starting request")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("[v0] Fetching profiles from Supabase...")

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.log("[v0] Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Error al obtener miembros", details: profilesError }, { status: 500 })
    }

    console.log("[v0] Found profiles:", profiles?.length || 0)

    const {
      data: { users: authUsers },
      error: authError,
    } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.log("[v0] Error fetching auth users:", authError)
      return NextResponse.json({ error: "Error al obtener usuarios de auth", details: authError }, { status: 500 })
    }

    const authUserIds = new Set(authUsers.map((u) => u.id))

    const validProfiles = profiles?.filter((p) => authUserIds.has(p.id)) || []

    console.log("[v0] Valid profiles (with auth.user):", validProfiles.length)

    const { data: reservationCounts } = await supabase.from("reservations").select("user_id")

    const rentalCountMap: Record<string, number> = {}
    reservationCounts?.forEach((r) => {
      rentalCountMap[r.user_id] = (rentalCountMap[r.user_id] || 0) + 1
    })

    const members =
      validProfiles?.map((profile) => ({
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario",
        email: profile.email,
        phone: profile.shipping_phone || "No disponible",
        membership: profile.membership_type || "free",
        joinDate: profile.created_at,
        status: profile.membership_status === "active" ? "active" : "inactive",
        currentBag: null,
        totalRentals: rentalCountMap[profile.id] || 0,
        shippingAddress: profile.shipping_address,
        shippingCity: profile.shipping_city,
        shippingPostalCode: profile.shipping_postal_code,
        shippingCountry: profile.shipping_country,
      })) || []

    const stats = {
      total: members.length,
      signature: members.filter((m) => m.membership?.toLowerCase() === "signature").length,
      prive: members.filter((m) => m.membership?.toLowerCase() === "prive").length,
      essentiel: members.filter((m) => m.membership?.toLowerCase() === "essentiel").length,
      free: members.filter((m) => !m.membership || m.membership?.toLowerCase() === "free").length,
      active: members.filter((m) => m.status === "active").length,
    }

    console.log("[v0] Returning members:", members.length, "Stats:", stats)

    return NextResponse.json({
      members,
      total: members.length,
      stats,
    })
  } catch (error) {
    console.error("[v0] Error in admin members API:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    console.log("[v0] Deleting orphaned records for user:", userId)

    const { data: authUser } = await supabase.auth.admin.getUserById(userId)

    if (authUser.user) {
      return NextResponse.json({ error: "Cannot delete: user still exists in auth.users" }, { status: 400 })
    }

    await supabase.from("audit_log").delete().eq("user_id", userId)
    await supabase.from("notifications").delete().eq("user_id", userId)
    await supabase.from("gift_card_transactions").delete().eq("user_id", userId)
    await supabase.from("reservations").delete().eq("user_id", userId)
    await supabase.from("membership_intents").delete().eq("user_id", userId)
    await supabase.from("user_memberships").delete().eq("user_id", userId)
    await supabase.from("profiles").delete().eq("id", userId)

    console.log("[v0] Successfully deleted orphaned records for user:", userId)

    return NextResponse.json({ success: true, message: "Registros huérfanos eliminados" })
  } catch (error) {
    console.error("[v0] Error deleting orphaned records:", error)
    return NextResponse.json({ error: "Error al eliminar registros", details: error }, { status: 500 })
  }
}
