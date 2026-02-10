import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const { email, name, phone, preferences } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: true, message: "Email inválido" }, { status: 400 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const { data: existingSubscription } = await supabase
      .from("newsletter_subscriptions")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (existingSubscription) {
      if (existingSubscription.status === "unsubscribed") {
        const { error: updateError } = await supabase
          .from("newsletter_subscriptions")
          .update({
            status: "active",
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
            preferences: preferences || existingSubscription.preferences,
            name: name || existingSubscription.name,
            phone: phone || existingSubscription.phone,
          })
          .eq("email", email)

        if (updateError) {
          console.error("Error reactivating subscription:", updateError)
          return NextResponse.json({ error: true, message: "Error al reactivar suscripción" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Suscripción reactivada exitosamente",
        })
      }

      return NextResponse.json({ error: true, message: "Este email ya está suscrito" }, { status: 409 })
    }

    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .insert({
        email,
        name: name || null,
        phone: phone || null,
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

    if (error) {
      console.error("Error creating newsletter subscription:", error)
      return NextResponse.json({ error: true, message: "Error al crear suscripción" }, { status: 500 })
    }

    try {
      const { adminNotifications } = await import("@/lib/admin-notifications")
      await adminNotifications.notifyNewNewsletterSubscription({
        email,
        name,
        preferences,
      })
      console.log("[v0] ✅ Admin notificado de nueva suscripción newsletter")
    } catch (notifError) {
      console.error("[v0] ❌ Error notificando admin:", notifError)
    }

    return NextResponse.json({
      success: true,
      message: "Suscripción exitosa",
      data,
    })
  } catch (error) {
    console.error("Unexpected error in newsletter subscription:", error)
    return NextResponse.json({ error: true, message: "Error inesperado al procesar suscripción" }, { status: 500 })
  }
}
