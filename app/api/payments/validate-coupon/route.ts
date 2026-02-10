import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { couponCode, amount } = await request.json()

    if (!couponCode) {
      return NextResponse.json({ error: "Código de cupón requerido" }, { status: 400 })
    }

    let coupon: Stripe.Coupon | null = null

    try {
      coupon = await stripe.coupons.retrieve(couponCode)
    } catch {
      // No encontrado con ID exacto, continuar buscando
    }

    if (!coupon) {
      const coupons = await stripe.coupons.list({ limit: 100 })
      coupon =
        coupons.data.find(
          (c) => c.id.toLowerCase() === couponCode.toLowerCase() || c.name?.toLowerCase() === couponCode.toLowerCase(),
        ) || null
    }

    if (!coupon) {
      try {
        const promoCodes = await stripe.promotionCodes.list({
          active: true,
          limit: 100,
        })

        const promoCode = promoCodes.data.find((p) => p.code.toLowerCase() === couponCode.toLowerCase())

        if (promoCode) {
          coupon = promoCode.coupon as Stripe.Coupon
        }
      } catch {
        // Error buscando promotion codes
      }
    }

    if (!coupon) {
      return NextResponse.json({ error: "Cupón no válido o expirado" }, { status: 404 })
    }

    // Verificar si el cupón está activo
    if (!coupon.valid) {
      return NextResponse.json({ error: "Este cupón ya no está activo" }, { status: 400 })
    }

    // Calcular descuento
    let finalAmount = amount
    let discountAmount = 0

    if (coupon.percent_off) {
      discountAmount = (amount * coupon.percent_off) / 100
      finalAmount = amount - discountAmount
    } else if (coupon.amount_off) {
      // amount_off está en centavos, convertir a euros
      discountAmount = coupon.amount_off / 100
      finalAmount = Math.max(0, amount - discountAmount)
    }

    // Redondear a 2 decimales
    finalAmount = Math.round(finalAmount * 100) / 100

    return NextResponse.json({
      valid: true,
      code: coupon.id,
      name:
        coupon.name ||
        `Descuento ${coupon.percent_off ? `${coupon.percent_off}%` : `${(coupon.amount_off || 0) / 100}€`}`,
      percentOff: coupon.percent_off || null,
      amountOff: coupon.amount_off ? coupon.amount_off / 100 : null,
      finalAmount,
      discountAmount: Math.round(discountAmount * 100) / 100,
    })
  } catch (error) {
    console.error("Error validando cupón:", error)
    return NextResponse.json({ error: "Error al validar el cupón" }, { status: 500 })
  }
}
