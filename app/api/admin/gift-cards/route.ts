import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

// Genera código único
function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `SEMZO-${part1}-${part2}`
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: giftCards, error } = await supabase
      .from("gift_cards")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener estadísticas
    const stats = {
      total: giftCards?.length || 0,
      active: giftCards?.filter((g) => g.status === "active").length || 0,
      used: giftCards?.filter((g) => g.status === "used").length || 0,
      pending: giftCards?.filter((g) => g.status === "pending").length || 0,
      totalValue: giftCards?.reduce((sum, g) => sum + (g.original_amount || 0), 0) || 0,
      remainingValue: giftCards?.filter((g) => g.status === "active").reduce((sum, g) => sum + (g.amount || 0), 0) || 0,
    }

    return NextResponse.json({ giftCards, stats })
  } catch (error) {
    console.error("Error fetching gift cards:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

// Crear gift card manualmente (admin)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { amount, recipientEmail, recipientName, expiresInMonths = 24 } = await request.json()

    const amountCents = Math.round(amount * 100)

    // Generar código único
    let code = generateGiftCardCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase.from("gift_cards").select("id").eq("code", code).single()

      if (!existing) break
      code = generateGiftCardCode()
      attempts++
    }

    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + expiresInMonths)

    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .insert({
        code,
        amount: amountCents,
        original_amount: amountCents,
        status: "active", // Admin crea activas directamente
        recipient_email: recipientEmail || null,
        recipient_name: recipientName || null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ giftCard })
  } catch (error) {
    console.error("Error creating gift card:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
