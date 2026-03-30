import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"

// POST - Probar conexión con Correos API
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

    // Crear cliente de Correos y probar conexión
    const correos = new CorreosAPI({ clientId, clientSecret })
    const result = await correos.testConnection()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing Correos connection:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al probar conexión",
      },
      { status: 500 }
    )
  }
}
