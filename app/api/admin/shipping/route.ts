import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Obtener todas las direcciones de envío (solo admin)
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Admin API - User check:", { user: user?.email, authError })

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminEmails = ["ergomara@hotmail.com", "admin@semzoprive.com"] // Agregar emails de admin aquí

    if (!adminEmails.includes(user.email || "")) {
      console.log("[v0] Admin API - Access denied for:", user.email)
      return NextResponse.json({ error: "Acceso denegado - Solo administradores" }, { status: 403 })
    }

    console.log("[v0] Admin API - Admin access granted for:", user.email)

    const { data: shippingData, error } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        membership_type,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_phone,
        shipping_country,
        created_at,
        updated_at
      `)
      .order("updated_at", { ascending: false })

    console.log("[v0] Admin API - Query result:", {
      error,
      dataCount: shippingData?.length,
      sampleData: shippingData?.[0],
    })

    if (error) {
      console.error("Error fetching shipping data:", error)
      return NextResponse.json({ error: "Error al obtener información de envío" }, { status: 500 })
    }

    const usersWithShipping = shippingData?.filter((user) => user.shipping_address) || []
    const usersWithoutShipping = shippingData?.filter((user) => !user.shipping_address) || []

    const stats = {
      total: shippingData?.length || 0,
      withShipping: usersWithShipping.length,
      withoutShipping: usersWithoutShipping.length,
      byMembership: {
        prive: usersWithShipping.filter((u) => u.membership_type === "prive").length,
        signature: usersWithShipping.filter((u) => u.membership_type === "signature").length,
        essentiel: usersWithShipping.filter((u) => u.membership_type === "essentiel").length,
        free: usersWithShipping.filter((u) => !u.membership_type || u.membership_type === "free").length,
      },
    }

    console.log("[v0] Admin API - Stats:", stats)

    return NextResponse.json({
      shipping_addresses: usersWithShipping,
      all_users: shippingData,
      stats,
      total: usersWithShipping.length,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
