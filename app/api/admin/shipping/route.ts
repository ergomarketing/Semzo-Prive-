import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// GET - Obtener todas las direcciones de envío (solo admin)
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const adminEmails = ["ergomara@hotmail.com", "admin@semzoprive.com"] // Agregar emails de admin aquí

    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Acceso denegado - Solo administradores" }, { status: 403 })
    }

    // Obtener todas las direcciones de envío con información del usuario
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
      .not("shipping_address", "is", null)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching shipping data:", error)
      return NextResponse.json({ error: "Error al obtener información de envío" }, { status: 500 })
    }

    return NextResponse.json({
      shipping_addresses: shippingData,
      total: shippingData?.length || 0,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
