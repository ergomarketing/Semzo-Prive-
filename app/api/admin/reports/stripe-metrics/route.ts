import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-01-27.acacia" })

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfMonthUnix = Math.floor(startOfMonth.getTime() / 1000)

    // Obtener pagos completados este mes desde Stripe
    const charges = await stripe.charges.list({
      created: { gte: startOfMonthUnix },
      limit: 100,
    })

    const successfulCharges = charges.data.filter((c) => c.status === "succeeded" && !c.refunded)
    const totalRevenue = successfulCharges.reduce((sum, c) => sum + c.amount, 0)
    const totalPayments = successfulCharges.length

    // Obtener MRR desde suscripciones activas en Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    })

    const mrr = subscriptions.data.reduce((sum, sub) => {
      const item = sub.items.data[0]
      if (!item?.price) return sum

      const unitAmount = item.price.unit_amount || 0
      const interval = item.price.recurring?.interval
      const intervalCount = item.price.recurring?.interval_count || 1

      // Normalizar a mensual
      if (interval === "month") {
        return sum + unitAmount / intervalCount
      } else if (interval === "year") {
        return sum + unitAmount / (12 * intervalCount)
      }
      return sum + unitAmount
    }, 0)

    return NextResponse.json({
      totalRevenue,
      totalPayments,
      mrr: Math.round(mrr),
      currency: "eur",
      period: {
        start: startOfMonth.toISOString(),
        end: now.toISOString(),
      },
    })
  } catch (error) {
    console.error("[Stripe Metrics] Error:", error)
    return NextResponse.json({ error: "Error fetching Stripe metrics" }, { status: 500 })
  }
}
