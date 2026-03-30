import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

// GET - Obtener credenciales de Correos (sin mostrar el secret completo)
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener credenciales de la tabla de configuración
    const { data: settings } = await supabase
      .from("logistics_settings")
      .select("api_credentials, is_enabled")
      .eq("carrier_name", "Correos")
      .single()

    if (!settings?.api_credentials) {
      return NextResponse.json({ configured: false })
    }

    const credentials = settings.api_credentials as { clientId: string; clientSecret: string }

    return NextResponse.json({
      configured: true,
      isEnabled: settings.is_enabled,
      clientId: credentials.clientId,
      // Solo mostrar últimos 4 caracteres del secret por seguridad
      clientSecretMasked: credentials.clientSecret
        ? `****${credentials.clientSecret.slice(-4)}`
        : null,
      // Para uso interno (no exponer al frontend directamente)
      clientSecret: credentials.clientSecret,
    })
  } catch (error) {
    console.error("Error getting Correos credentials:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// POST - Guardar credenciales de Correos
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { clientId, clientSecret } = await request.json()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID y Client Secret son requeridos" },
        { status: 400 }
      )
    }

    // Verificar si ya existe el registro de Correos
    const { data: existing } = await supabase
      .from("logistics_settings")
      .select("id")
      .eq("carrier_name", "Correos")
      .single()

    let error
    if (existing?.id) {
      // Actualizar registro existente
      const { error: updateError } = await supabase
        .from("logistics_settings")
        .update({
          api_credentials: { clientId, clientSecret },
          is_enabled: true,
          default_service: "PAQ_PREMIUM",
          updated_at: new Date().toISOString(),
        })
        .eq("carrier_name", "Correos")
      error = updateError
    } else {
      // Insertar nuevo registro
      const { error: insertError } = await supabase
        .from("logistics_settings")
        .insert({
          carrier_name: "Correos",
          api_credentials: { clientId, clientSecret },
          is_enabled: true,
          default_service: "PAQ_PREMIUM",
        })
      error = insertError
    }

    if (error) {
      console.error("Error saving Correos credentials:", error)
      return NextResponse.json({ error: "Error al guardar credenciales" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Credenciales guardadas correctamente" })
  } catch (error) {
    console.error("Error saving Correos credentials:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// DELETE - Eliminar credenciales de Correos
export async function DELETE() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar rol admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { error } = await supabase
      .from("logistics_settings")
      .update({ api_credentials: null, is_enabled: false })
      .eq("carrier_name", "Correos")

    if (error) {
      console.error("Error deleting Correos credentials:", error)
      return NextResponse.json({ error: "Error al eliminar credenciales" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Credenciales eliminadas" })
  } catch (error) {
    console.error("Error deleting Correos credentials:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
