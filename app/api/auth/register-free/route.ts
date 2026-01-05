import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/app/lib/auth-service"
import { EmailService } from "@/app/lib/email-service-improved"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: "Todos los campos son obligatorios" }, { status: 400 })
    }

    // Registrar usuario
    const result = await AuthService.registerUser({
      email,
      password,
      firstName,
      lastName,
    })

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 })
    }

    // Enviar email de bienvenida
    try {
      await EmailService.sendWelcomeEmail(email, `${firstName} ${lastName}`)
    } catch (emailError) {
      console.error("Error enviando email:", emailError)
      // No fallamos el registro si falla el email
    }

    return NextResponse.json({
      success: true,
      message: "Usuario registrado correctamente",
      user: result.user,
    })
  } catch (error) {
    console.error("Error en registro API:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
