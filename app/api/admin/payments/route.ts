import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function GET() {
  try {
    // Obtener los últimos 100 cobros desde Stripe
    const chargesResponse = await stripe.charges.list({
      limit: 100,
      expand: ["data.customer"],
    })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000

    const charges = chargesResponse.data.map((charge) => {
      const customer = charge.customer as Stripe.Customer | null
      return {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        created: charge.created,
        description: charge.description,
        customer_email: customer?.email || charge.billing_details?.email || null,
        customer_name: customer?.name || charge.billing_details?.name || null,
        payment_method_type: charge.payment_method_details?.type || "card",
        receipt_url: charge.receipt_url,
      }
    })

    const succeeded = charges.filter((c) => c.status === "succeeded")
    const stats = {
      totalRevenue: succeeded.reduce((sum, c) => sum + c.amount, 0) / 100,
      thisMonthRevenue:
        succeeded
          .filter((c) => c.created >= startOfMonth)
          .reduce((sum, c) => sum + c.amount, 0) / 100,
      totalCharges: charges.length,
      succeeded: succeeded.length,
      failed: charges.filter((c) => c.status === "failed").length,
      refunded: charges.filter((c) => c.status === "refunded").length,
    }

    return NextResponse.json({ charges, stats })
  } catch (error) {
    console.error("Error fetching Stripe payments:", error)
    return NextResponse.json({ charges: [], stats: { totalRevenue: 0, thisMonthRevenue: 0, totalCharges: 0, succeeded: 0, failed: 0, refunded: 0 } })
  }
}
