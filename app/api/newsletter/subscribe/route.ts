import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, preferences } = body

    console.log("[v0] 📧 Nueva suscripción al newsletter:", { email, name, preferences })

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_SUPABASE_URL

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] ❌ Supabase configuration missing")
      return NextResponse.json({ error: "Configuración del servidor incorrecta" }, { status: 500 })
    }

    // Crear cliente con service role key para bypasear RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (existingSubscriber) {
      // Si ya existe, actualizar preferencias
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          name: name || existingSubscriber.name,
          preferences: preferences || existingSubscriber.preferences,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)

      if (updateError) {
        console.error("[v0] ❌ Error updating newsletter subscription:", updateError.message)
        throw updateError
      }

      console.log("[v0] ✅ Suscripción actualizada:", email)
      return NextResponse.json({
        message: "Ya estás suscrito! Hemos actualizado tus preferencias.",
        subscriber: { email, name },
      })
    }

    const { data: subscriber, error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email,
        name: name || email.split("@")[0],
        preferences: preferences || {
          newArrivals: true,
          exclusiveOffers: true,
          styleGuides: true,
          events: false,
          membershipUpdates: true,
        },
        status: "active",
        subscribed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] ❌ Error storing newsletter subscription:", insertError.message)
      throw insertError
    }

    console.log("[v0] ✅ Suscripción guardada exitosamente:", email)

    return NextResponse.json({
      message: "¡Suscripción exitosa! Gracias por unirte a Semzo Magazine.",
      subscriber,
    })
  } catch (error: any) {
    console.error("[v0] ❌ Error en suscripción al newsletter:", error)
    return NextResponse.json(
      {
        error: "Error guardando suscripción",
        message: error.message || "Error desconocido",
      },
      { status: 500 },
    )
  }
}
