import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/app/lib/supabase-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 API Create Profile: Iniciando creación de perfil")

    const body = await request.json()
    const { userId, email, userData } = body

    if (!userId || !email) {
      return NextResponse.json(
        {
          success: false,
          message: "userId y email son requeridos",
        },
        { status: 400 },
      )
    }

    // Crear perfil desde datos de usuario auth
    const authUser = {
      id: userId,
      email: email,
      user_metadata: userData || {},
      email_confirmed_at: userData?.email_confirmed_at,
      created_at: userData?.created_at || new Date().toISOString(),
      updated_at: userData?.updated_at || new Date().toISOString(),
      last_sign_in_at: userData?.last_sign_in_at,
    }

    const result = await authService.createProfileFromAuthUser(authUser)

    console.log("📤 Resultado de creación de perfil:", {
      success: result.success,
      message: result.message,
      hasUser: !!result.user,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("❌ Error en API Create Profile:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint para crear perfiles. Usa POST.",
    methods: ["POST"],
    requiredFields: ["userId", "email"],
    optionalFields: ["userData"],
  })
}
