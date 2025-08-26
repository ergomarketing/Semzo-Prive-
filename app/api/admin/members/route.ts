import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] GET /api/admin/members - Starting request")

    // Verificar autorización de admin
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[v0] No authorization header found")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("[v0] Auth error:", authError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const adminEmails = ["ergomara@hotmail.com", "admin@semzoprive.com"]
    if (!adminEmails.includes(user.email || "")) {
      console.log("[v0] User not authorized as admin:", user.email)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    console.log("[v0] Admin authorized, fetching members...")

    // Obtener todos los perfiles de usuarios
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (profilesError) {
      console.log("[v0] Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Error al obtener miembros" }, { status: 500 })
    }

    console.log("[v0] Found profiles:", profiles?.length || 0)

    // Transformar datos para el formato esperado por el frontend
    const members =
      profiles?.map((profile) => ({
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario",
        email: profile.email,
        phone: profile.shipping_phone || "No disponible",
        membership: profile.membership_type || "free",
        joinDate: profile.created_at,
        status: profile.membership_status || "active",
        currentBag: null, // Por ahora null, se puede agregar lógica de bolsos más tarde
        totalRentals: 0, // Por ahora 0, se puede agregar lógica de alquileres más tarde
        shippingAddress: profile.shipping_address,
        shippingCity: profile.shipping_city,
        shippingPostalCode: profile.shipping_postal_code,
        shippingCountry: profile.shipping_country,
      })) || []

    console.log("[v0] Returning members:", members.length)

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
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
