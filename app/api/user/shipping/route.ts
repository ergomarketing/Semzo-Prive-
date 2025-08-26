import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// GET - Obtener información de envío del usuario
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

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("shipping_address, shipping_city, shipping_postal_code, shipping_phone, shipping_country")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error fetching shipping info:", error)
      return NextResponse.json({ error: "Error al obtener información de envío" }, { status: 500 })
    }

    return NextResponse.json({ shipping: profile })
  } catch (error) {
    console.error("Error in GET /api/user/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT - Actualizar información de envío del usuario
export async function PUT(request: NextRequest) {
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

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { shipping_address, shipping_city, shipping_postal_code, shipping_phone, shipping_country } = body

    // Validar campos requeridos
    if (!shipping_address || !shipping_city || !shipping_postal_code || !shipping_phone) {
      return NextResponse.json(
        {
          error: "Todos los campos son requeridos: dirección, ciudad, código postal y teléfono",
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_phone,
        shipping_country: shipping_country || "España",
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating shipping info:", error)
      return NextResponse.json({ error: "Error al actualizar información de envío" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Información de envío actualizada correctamente",
      shipping: {
        shipping_address: data.shipping_address,
        shipping_city: data.shipping_city,
        shipping_postal_code: data.shipping_postal_code,
        shipping_phone: data.shipping_phone,
        shipping_country: data.shipping_country,
      },
    })
  } catch (error) {
    console.error("Error in PUT /api/user/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
