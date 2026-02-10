import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        profiles(full_name, email)
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      return NextResponse.json([])
    }

    const paymentsWithDetails = await Promise.all(
      (data || []).map(async (payment) => {
        if (payment.reservation_id) {
          const { data: reservation } = await supabase
            .from("reservations")
            .select(
              `
              id,
              start_date,
              end_date,
              bag_id,
              bags(name, brand)
            `,
            )
            .eq("id", payment.reservation_id)
            .single()

          return { ...payment, reservation }
        }
        return payment
      }),
    )

    return NextResponse.json(paymentsWithDetails)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json([])
  }
}
