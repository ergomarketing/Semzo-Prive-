import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

// Genera código único estilo SEMZO-XXXX-XXXX
function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `SEMZO-${part1}-${part2}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { amount, recipientEmail, recipientName, personalMessage } = await request.json()

    // Validar monto (mínimo 25€, máximo 500€)
    const amountCents = Math.round(amount * 100)
    if (amountCents < 2500 || amountCents > 50000) {
      return NextResponse.json({ error: "El monto debe ser entre 25€ y 500€" }, { status: 400 })
    }

    // Crear PaymentIntent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "eur",
      metadata: {
        type: "gift_card",
        user_id: user.id,
        recipient_email: recipientEmail || "",
        recipient_name: recipientName || "",
      },
    })

    // Generar código único
    let code = generateGiftCardCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase.from("gift_cards").select("id").eq("code", code).single()

      if (!existing) break
      code = generateGiftCardCode()
      attempts++
    }

    // Crear gift card pendiente
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 2) // Válida por 2 años

    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .insert({
        code,
        amount: amountCents,
        original_amount: amountCents,
        status: "pending", // Se activa cuando el pago se confirma
        purchased_by: user.id,
        recipient_email: recipientEmail || null,
        recipient_name: recipientName || null,
        personal_message: personalMessage || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating gift card:", error)
      return NextResponse.json({ error: "Error al crear gift card" }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      giftCardId: giftCard.id,
      code: giftCard.code,
    })
  } catch (error) {
    console.error("Error in gift card purchase:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
