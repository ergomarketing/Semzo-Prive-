import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET() {
  try {
    console.log("[v0] 💳 Fetching payments from database...")

    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })

    if (paymentsError) {
      console.error("[v0] ❌ Error fetching payments:", paymentsError)
      return NextResponse.json([])
    }

    console.log(`[v0] ✅ Found ${paymentsData?.length || 0} payments`)

    const enrichedPayments = await Promise.all(
      (paymentsData || []).map(async (payment) => {
        // Fetch user profile
        let profile = null
        if (payment.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", payment.user_id)
            .single()
          profile = profileData
        }

        // Fetch reservation and bag
        let reservation = null
        if (payment.reservation_id) {
          const { data: reservationData } = await supabase
            .from("reservations")
            .select("id, start_date, end_date, bag_id")
            .eq("id", payment.reservation_id)
            .single()

          if (reservationData && reservationData.bag_id) {
            const { data: bagData } = await supabase
              .from("bags")
              .select("name, brand")
              .eq("id", reservationData.bag_id)
              .single()

            reservation = {
              ...reservationData,
              bags: bagData,
            }
          }
        }

        return {
          ...payment,
          profiles: profile,
          reservations: reservation,
        }
      })
    )

    console.log("[v0] ✅ Payments enriched with related data")
    return NextResponse.json(enrichedPayments)
  } catch (error) {
    console.error("[v0] ❌ Error in payments API:", error)
    return NextResponse.json([])
  }
}
