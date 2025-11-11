import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Verificar que las variables de entorno estén disponibles
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY no está configurada")
}

const stripe = new Stripe(stripeSecretKey || "", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log("🔄 Iniciando creación de payment intent...", new Date().toISOString())

  try {
    // Verificar configuración
    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY no configurada")
      return NextResponse.json(
        {
          error: "Configuración de Stripe incompleta",
          details: "STRIPE_SECRET_KEY no está configurada",
        },
        { status: 500 },
      )
    }

    const { amount, membershipType, userEmail } = await request.json()

    console.log("📊 Datos recibidos:", {
      amount,
      membershipType,
      userEmail,
      timestamp: new Date().toISOString(),
    })

    // Validar datos
    if (!amount || !membershipType || !userEmail) {
      console.error("❌ Datos faltantes:", { amount, membershipType, userEmail })
      return NextResponse.json(
        {
          error: "Datos incompletos",
          details: "Se requieren amount, membershipType y userEmail",
        },
        { status: 400 },
      )
    }

    if (typeof amount !== "number" || amount <= 0) {
      console.error("❌ Monto inválido:", amount)
      return NextResponse.json(
        {
          error: "Monto inválido",
          details: "El monto debe ser un número positivo",
        },
        { status: 400 },
      )
    }

    if (typeof userEmail !== "string" || userEmail.trim() === "") {
      console.error("❌ Email vacío o inválido:", userEmail)
      return NextResponse.json(
        {
          error: "Dirección de correo electrónico no válida",
          details: "Se requiere un email válido para procesar el pago",
        },
        { status: 400 },
      )
    }

    // Crear payment intent
    console.log("💳 Creando payment intent con Stripe...")

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        membershipType,
        userEmail,
        createdAt: new Date().toISOString(),
      },
    })

    const processingTime = Date.now() - startTime
    console.log("✅ Payment intent creado exitosamente:", {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      processingTime: `${processingTime}ms`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("❌ Error en create-intent:", {
      error,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    })

    let errorMessage = "Error interno del servidor"
    let errorDetails = ""

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Error de Stripe: ${error.type}`
      errorDetails = `Código: ${error.code} | Mensaje: ${error.message}`
      console.error("❌ Error específico de Stripe:", {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      })
    } else if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
