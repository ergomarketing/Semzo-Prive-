import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: Request) {
  try {
    const { userId, membershipType, returnUrl } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 })
    }

    // Obtener datos del usuario
    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", userId).single()

    // Crear sesión de verificación de Stripe Identity
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: userId,
        membership_type: membershipType || "pending",
      },
      options: {
        document: {
          require_matching_selfie: true,
          allowed_types: ["driving_license", "passport", "id_card"],
        },
      },
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/verification-complete`,
    })

    // Guardar referencia de verificación en la base de datos
    await supabase.from("identity_verifications").upsert({
      user_id: userId,
      stripe_verification_id: verificationSession.id,
      status: verificationSession.status,
      membership_type: membershipType,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      verificationSessionId: verificationSession.id,
      url: verificationSession.url,
      clientSecret: verificationSession.client_secret,
    })
  } catch (error: any) {
    console.error("Error creating verification session:", error)
    return NextResponse.json({ error: error.message || "Error al crear sesión de verificación" }, { status: 500 })
  }
}
