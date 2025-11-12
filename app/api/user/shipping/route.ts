import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// GET - Obtener información de envío del usuario
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("shipping_address, shipping_city, shipping_postal_code, shipping_phone, shipping_country")
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching shipping info:", error)
      return NextResponse.json({ error: "Error al obtener información de envío" }, { status: 500 })
    }

    return NextResponse.json({ shipping: profile || null })
  } catch (error) {
    console.error("Error in GET /api/user/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT - Actualizar información de envío del usuario
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

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

    const { data: profileCheck } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()

    if (!profileCheck) {
      // Crear perfil usando Service Role Key para bypass de RLS
      const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })

      const { error: insertError } = await supabaseAdmin.from("profiles").insert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        phone: user.user_metadata?.phone || "",
      })

      if (insertError) {
        console.error("Error creating profile:", insertError)
        return NextResponse.json({ error: "Error al crear el perfil del usuario" }, { status: 500 })
      }
    }

    // Actualizar la dirección
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
      .maybeSingle()

    if (error) {
      console.error("Error updating shipping info:", error)
      return NextResponse.json({ error: "Error al actualizar información de envío" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "No se encontró el perfil del usuario" }, { status: 404 })
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
