import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const { email, name, preferences } = await request.json()

    console.log("[v0] Newsletter subscription attempt:", { email, name })

    // Validar email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Email inválido" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar si ya está suscrito
    const { data: existing } = await supabase.from("newsletter_subscribers").select("*").eq("email", email).single()

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          {
            success: false,
            message: "Este email ya está suscrito a nuestro newsletter",
          },
          { status: 400 }
        )
      } else {
        // Reactivar suscripción
        const { error } = await supabase
          .from("newsletter_subscribers")
          .update({
            status: "active",
            preferences: preferences || existing.preferences,
            updated_at: new Date().toISOString(),
          })
          .eq("email", email)

        if (error) {
          console.error("[v0] Error reactivating subscription:", error)
          return NextResponse.json({ success: false, message: "Error al reactivar suscripción" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "¡Bienvenido de nuevo! Tu suscripción ha sido reactivada",
        })
      }
    }

    // Crear nueva suscripción
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      name: name || email.split("@")[0],
      status: "active",
      preferences: preferences || {
        newArrivals: true,
        exclusiveOffers: true,
        styleGuides: true,
        events: false,
        membershipUpdates: true,
      },
      subscribed_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error creating subscription:", error)
      return NextResponse.json({ success: false, message: "Error al procesar suscripción" }, { status: 500 })
    }

    console.log("[v0] ✅ Newsletter subscription successful:", email)

    return NextResponse.json({
      success: true,
      message: "¡Gracias por suscribirte! Pronto recibirás nuestro newsletter",
    })
  } catch (error) {
    console.error("[v0] Newsletter subscription error:", error)
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 })
  }
}
