import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET - Obtener credenciales de Correos
export async function GET() {
  try {
    const supabase = getServiceClient()

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
      clientSecretMasked: credentials.clientSecret
        ? `****${credentials.clientSecret.slice(-4)}`
        : null,
    })
  } catch (error) {
    console.error("Error getting Correos credentials:", error)
    return NextResponse.json({ configured: false })
  }
}

// POST - Guardar credenciales de Correos
export async function POST(request: Request) {
  try {
    const supabase = getServiceClient()
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
      return NextResponse.json({ error: "Error al guardar: " + error.message }, { status: 500 })
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
    const supabase = getServiceClient()

    const { error } = await supabase
      .from("logistics_settings")
      .update({ api_credentials: null, is_enabled: false })
      .eq("carrier_name", "Correos")

    if (error) {
      return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting Correos credentials:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
