import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Categoria C - Miembro presente (listados generales)
const CATEGORY_C_STATES = [
  "active",
  "cancelled_active",
  "past_due",
  "paused",
  "limited_access",
  "paid_pending_verification",
  "pending_verification",
]

// Categoria A - Miembro activo comercial (stats por tipo / revenue)
const CATEGORY_A_STATES = ["active", "cancelled_active", "past_due"]

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: "Error al obtener miembros", details: profilesError }, { status: 500 })
    }

    const {
      data: { users: authUsers },
      error: authError,
    } = await supabase.auth.admin.listUsers()

    if (authError) {
      return NextResponse.json({ error: "Error al obtener usuarios de auth", details: authError }, { status: 500 })
    }

    const authUserIds = new Set(authUsers.map((u) => u.id))
    const validProfiles = profiles?.filter((p) => authUserIds.has(p.id)) || []

    const [{ data: reservationCounts }, { data: memberships }, { data: bagPasses }] = await Promise.all([
      supabase.from("reservations").select("user_id"),
      // Categoria C: incluir TODAS las socias presentes
      supabase
        .from("user_memberships")
        .select("user_id, membership_type, status, created_at")
        .in("status", CATEGORY_C_STATES)
        .order("created_at", { ascending: false }),
      // Pases por user_id (status available = pase comprado y disponible)
      supabase.from("bag_passes").select("user_id, status, pass_tier"),
    ])

    const rentalCountMap: Record<string, number> = {}
    reservationCounts?.forEach((r) => {
      rentalCountMap[r.user_id] = (rentalCountMap[r.user_id] || 0) + 1
    })

    // Mapa user_id -> membresia mas reciente (ya viene ordenada desc)
    const membershipMap: Record<string, { membership_type: string; status: string }> = {}
    memberships?.forEach((m) => {
      if (!membershipMap[m.user_id]) {
        membershipMap[m.user_id] = { membership_type: m.membership_type, status: m.status }
      }
    })

    // Mapa user_id -> { available, used, expired }
    const passesMap: Record<string, { available: number; used: number; expired: number }> = {}
    bagPasses?.forEach((p) => {
      if (!passesMap[p.user_id]) passesMap[p.user_id] = { available: 0, used: 0, expired: 0 }
      const k = p.status as "available" | "used" | "expired"
      if (k in passesMap[p.user_id]) passesMap[p.user_id][k] += 1
    })

    const members = validProfiles.map((profile) => {
      const m = membershipMap[profile.id]
      const passes = passesMap[profile.id] || { available: 0, used: 0, expired: 0 }
      return {
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario",
        email: profile.email,
        phone: profile.shipping_phone || "No disponible",
        membership: m?.membership_type || "free",
        membershipStatus: m?.status || "no_membership",
        joinDate: profile.created_at,
        // "Activo" en UI = Categoria A (esta pagando o vigente)
        status: m && CATEGORY_A_STATES.includes(m.status) ? "active" : "inactive",
        currentBag: null,
        totalRentals: rentalCountMap[profile.id] || 0,
        passesAvailable: passes.available,
        passesUsed: passes.used,
        passesExpired: passes.expired,
        shippingAddress: profile.shipping_address,
        shippingCity: profile.shipping_city,
        shippingPostalCode: profile.shipping_postal_code,
        shippingCountry: profile.shipping_country,
      }
    })

    // Stats por tipo: Categoria A (solo socias que pagan/vigentes)
    const activeMembers = members.filter((m) => CATEGORY_A_STATES.includes(m.membershipStatus))
    const stats = {
      total: members.length,
      petite: activeMembers.filter((m) => m.membership?.toLowerCase() === "petite").length,
      essentiel: activeMembers.filter((m) => m.membership?.toLowerCase() === "essentiel").length,
      signature: activeMembers.filter((m) => m.membership?.toLowerCase() === "signature").length,
      prive: activeMembers.filter((m) => m.membership?.toLowerCase() === "prive").length,
      free: members.filter(
        (m) => !m.membership || m.membership === "free" || m.membershipStatus === "no_membership",
      ).length,
      active: activeMembers.length,
    }

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

    const { data: authUser } = await supabase.auth.admin.getUserById(userId)

    if (authUser.user) {
      return NextResponse.json({ error: "Cannot delete: user still exists in auth.users" }, { status: 400 })
    }

    await supabase.from("audit_log").delete().eq("user_id", userId)
    await supabase.from("notifications").delete().eq("user_id", userId)
    await supabase.from("gift_card_transactions").delete().eq("user_id", userId)
    await supabase.from("bag_passes").delete().eq("user_id", userId)
    await supabase.from("reservations").delete().eq("user_id", userId)
    await supabase.from("membership_intents").delete().eq("user_id", userId)
    await supabase.from("user_memberships").delete().eq("user_id", userId)
    await supabase.from("profiles").delete().eq("id", userId)

    return NextResponse.json({ success: true, message: "Registros huerfanos eliminados" })
  } catch (error) {
    console.error("[v0] Error deleting orphaned records:", error)
    return NextResponse.json({ error: "Error al eliminar registros", details: error }, { status: 500 })
  }
}
