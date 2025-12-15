import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: giftCards, error } = await supabase
      .from("gift_cards")
      .select(
        `
        id,
        code,
        amount,
        original_amount,
        status,
        expires_at,
        created_at,
        used_by,
        used_at
      `,
      )
      .eq("used_by", user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const cardsWithTransactions = await Promise.all(
      (giftCards || []).map(async (card) => {
        const { data: transactions } = await supabase
          .from("gift_card_transactions")
          .select("amount_used, created_at, order_reference")
          .eq("gift_card_id", card.id)
          .order("created_at", { ascending: false })

        return {
          ...card,
          transactions: transactions || [],
        }
      }),
    )

    return NextResponse.json({ giftCards: cardsWithTransactions })
  } catch (error) {
    console.error("Error fetching user gift cards:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
