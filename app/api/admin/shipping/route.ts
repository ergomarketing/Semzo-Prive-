import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data: shippingData, error } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        phone,
        membership_type,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_phone,
        shipping_country,
        document_type,
        document_number,
        created_at,
        updated_at
      `)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching shipping data:", error)
      return NextResponse.json({ error: "Error al obtener información de envío" }, { status: 500 })
    }

    // Fallback: si no hay shipping_phone usar phone del perfil
    const normalized = (shippingData || []).map((u: any) => ({
      ...u,
      shipping_phone: u.shipping_phone || u.phone || null,
    }))

    const usersWithShipping = normalized.filter((user) => user.shipping_address)
    const usersWithoutShipping = normalized.filter((user) => !user.shipping_address)

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

    return NextResponse.json({
      shipping_addresses: usersWithShipping,
      all_users: normalized,
      stats,
      total: usersWithShipping.length,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/admin/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
