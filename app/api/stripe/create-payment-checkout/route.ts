import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const { amountCents, productName } = await req.json()

    if (!amountCents || !productName) {
      return NextResponse.json({ error: "Faltan datos: amountCents y productName son requeridos" }, { status: 400 })
    }

    if (amountCents < 50) {
      return NextResponse.json({ error: "El importe mínimo es 0.50€" }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzo-prive.vercel.app"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: "Acceso semanal a un bolso de lujo",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?pase=success`,
      cancel_url: `${baseUrl}/cart?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("[create-payment-checkout] error:", error?.message)
    return NextResponse.json({ error: "Error creando sesión de pago: " + error?.message }, { status: 500 })
  }
}
