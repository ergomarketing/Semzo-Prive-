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

    // Email del usuario para buscar GCs asignadas por recipient_email
    const userEmail = user.email || ""

    // 1. GCs directamente usadas por el usuario (used_by = user.id)
    const { data: directGiftCards } = await supabase
      .from("gift_cards")
      .select("id, code, amount, original_amount, status, expires_at, created_at, used_by, used_at")
      .eq("used_by", user.id)
      .order("created_at", { ascending: false })

    // 2. GCs asignadas por recipient_email (cubre el caso en que se asignaron
    //    antes de que existiera el user_id vinculado, o GCs con saldo disponible)
    const { data: recipientGiftCards } = userEmail
      ? await supabase
          .from("gift_cards")
          .select("id, code, amount, original_amount, status, expires_at, created_at, used_by, used_at")
          .eq("recipient_email", userEmail)
          .order("created_at", { ascending: false })
      : { data: [] }

    // 3. GCs usadas via membership_intents
    const { data: intentsWithGiftCards } = await supabase
      .from("membership_intents")
      .select("gift_card_id")
      .eq("user_id", user.id)
      .not("gift_card_id", "is", null)

    const intentGiftCardIds = (intentsWithGiftCards || []).map((i) => i.gift_card_id).filter(Boolean)

    let intentGiftCards: any[] = []
    if (intentGiftCardIds.length > 0) {
      const { data } = await supabase
        .from("gift_cards")
        .select("id, code, amount, original_amount, status, expires_at, created_at, used_by, used_at")
        .in("id", intentGiftCardIds)
        .order("created_at", { ascending: false })
      intentGiftCards = data || []
    }

    // Merge and deduplicate (directas + recipient_email + intents)
    const allGiftCards = [...(directGiftCards || []), ...(recipientGiftCards || []), ...intentGiftCards]
    const uniqueGiftCards = allGiftCards.filter(
      (card, index, self) => index === self.findIndex((c) => c.id === card.id),
    )
    const giftCards = uniqueGiftCards
    const error = null

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
