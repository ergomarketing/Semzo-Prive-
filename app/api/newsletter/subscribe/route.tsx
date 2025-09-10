import { NextResponse } from "next/server"
import { supabase } from "@/app/lib/supabase-unified"

export async function POST(request: Request) {
  try {
    const { email, name, phone, preferences } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email y nombre son requeridos" }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    console.log("[v0] 📧 Nueva suscripción al newsletter:", { email, name, phone, preferences })

    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .insert([
        {
          email,
          name,
          phone,
          preferences,
          status: "active",
          subscribed_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("[v0] ❌ Error storing newsletter subscription:", error)
      return NextResponse.json({ error: "Error guardando suscripción" }, { status: 500 })
    }

    console.log("[v0] ✅ Suscripción registrada en Supabase exitosamente")
    return NextResponse.json({
      success: true,
      message: "¡Gracias por suscribirte!",
      data: {
        email,
        name,
        subscribedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] ❌ Error en suscripción al newsletter:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
