import { NextResponse } from "next/server"
import { CorreosAPI } from "@/lib/correos-api"

// POST - Probar conexión con Correos API
export async function POST(request: Request) {
  try {
    const { clientId, clientSecret } = await request.json()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID y Client Secret son requeridos" },
        { status: 400 }
      )
    }

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
