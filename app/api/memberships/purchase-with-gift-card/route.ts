export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      giftCardId,
      amountCents,
      membershipType,
      billingCycle,
      stripeCustomerId,
      stripePriceId,
    } = body

    if (!userId)
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })

    if (!giftCardId || !amountCents)
      return NextResponse.json({ error: "Gift card y monto requeridos" }, { status: 400 })

    const { data: giftCard } = await supabase
      .from("gift_cards")
      .select("id, amount, status")
      .eq("id", giftCardId)
      .single()

    if (!giftCard || giftCard.status !== "active")
      return NextResponse.json({ error: "Gift card inválida" }, { status: 400 })

    if (Math.round(giftCard.amount * 100) < amountCents)
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "consume_gift_card_atomic",
      {
        p_gift_card_id: giftCardId,
        p_amount: amountCents,
      }
    )

    if (rpcError || !rpcResult?.success)
      return NextResponse.json(
        { error: "Error procesando gift card" },
        { status: 500 }
      )

    // 🔥 CASO 100% CUBIERTO → activar directo
    if (!stripePriceId) {
      await supabase
        .from("user_memberships")
        .upsert(
          {
            user_id: userId,
            membership_type: membershipType,
            billing_cycle: billingCycle,
            status: "active",
            source: "gift_card",
            start_date: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )

      return NextResponse.json({
        success: true,
        message: "Membership activada con gift card",
      })
    }

    // 🔵 CASO Stripe normal
    await stripe.subscriptions.create(
      {
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        metadata: {
          user_id: userId,
          membership_type: membershipType,
          billing_cycle: billingCycle,
          gift_card_id: giftCardId,
        },
      },
      {
        idempotencyKey: `giftcard-${giftCardId}-${userId}`,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error interno: " + error.message },
      { status: 500 }
    )
  }
}
