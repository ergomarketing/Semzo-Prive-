import { getSupabaseServer } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      userId,
      passTier,
      bagPassTier, // alias
      bagId,
      quantity = 1,
      paymentMethod,
      stripePaymentId,
      giftCardCode,
      paymentId, // legacy
    } = body

    // Usar passTier o bagPassTier
    const tier = passTier || bagPassTier

    console.log("[v0] bag-passes/purchase received:", { userId, tier, bagId, quantity, paymentMethod, giftCardCode })

    // Validar tier
    const validTiers = ["essentiel", "lessentiel", "signature", "prive"]
    const normalizedTier = tier?.toLowerCase().replace(/^l'/, "").replace("'", "")

    if (!normalizedTier || !validTiers.includes(normalizedTier)) {
      return NextResponse.json({ error: "Tier de pase inválido" }, { status: 400 })
    }

    // Crear cliente Supabase con service role para operaciones admin
    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials")
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Si no viene userId, intentar obtenerlo de la sesión
    let finalUserId = userId
    if (!finalUserId) {
      const supabaseClient = await getSupabaseServer()
      if (supabaseClient) {
        const {
          data: { user },
        } = await supabaseClient.auth.getUser()
        finalUserId = user?.id
      }
    }

    if (!finalUserId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Precios de pases según tier
    const passPrices: Record<string, number> = {
      essentiel: 52.0,
      lessentiel: 52.0,
      signature: 99.0,
      prive: 149.0,
    }

    const pricePerPass = passPrices[normalizedTier] || 52.0
    const totalPrice = pricePerPass * quantity

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", finalUserId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil de usuario no encontrado" }, { status: 404 })
    }

    const { data: membership } = await supabase
      .from("user_memberships")
      .select("membership_type, status")
      .eq("user_id", finalUserId)
      .eq("status", "active")
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: "Necesitas una membresía activa para comprar pases" },
        { status: 403 }
      )
    }

    if (membership.membership_type !== "petite") {
      return NextResponse.json(
        { error: "Los pases solo están disponibles para la membresía Petite" },
        { status: 403 }
      )
    }

    // Crear los pases - pass_tier debe ser 'lessentiel', 'signature', o 'prive'
    const dbTier = normalizedTier === "essentiel" ? "lessentiel" : normalizedTier
    const passes = []
    for (let i = 0; i < quantity; i++) {
      passes.push({
        user_id: finalUserId,
        pass_tier: dbTier,
        status: "available",
        price: pricePerPass,
        purchased_at: new Date().toISOString(),
        expires_at: null,
      })
    }

    const { data: createdPasses, error: insertError } = await supabase.from("bag_passes").insert(passes).select()

    if (insertError) {
      console.error("Error creating passes:", insertError)
      // Si la tabla no existe, crear una alternativa en admin_notifications
      await supabase.from("admin_notifications").insert({
        type: "bag_pass_purchase",
        priority: "high",
        title: `Compra de Pase - ${normalizedTier.toUpperCase()}`,
        message: `${profile.full_name || profile.email} compró ${quantity} pase(s) ${normalizedTier}`,
        metadata: {
          user_id: finalUserId,
          email: profile.email,
          pass_tier: normalizedTier,
          quantity,
          total_price: totalPrice,
          payment_method: paymentMethod || (giftCardCode ? "gift_card" : "stripe"),
        },
      })

      // Continuar sin error fatal - el pase queda registrado en notificaciones
      console.log("[v0] Pase registrado en admin_notifications")
    }

    // Si se usó gift card, usar flujo idempotente con tabla de transacciones
    if (giftCardCode && createdPasses?.[0]?.id) {
      const passId = createdPasses[0].id

      const { data: giftCard } = await supabase
        .from("gift_cards")
        .select("id, amount")
        .eq("code", giftCardCode)
        .single()

      if (giftCard) {
        // gift_cards.amount esta en CENTAVOS. totalPrice esta en EUROS.
        // Convertir todo a cents para evitar mismatch de unidades.
        const previousAmountCents = giftCard.amount
        const totalPriceCents = Math.round(totalPrice * 100)

        if (previousAmountCents < totalPriceCents) {
          return NextResponse.json({ error: "Saldo insuficiente en la gift card" }, { status: 400 })
        }

        const newAmountCents = Math.max(0, previousAmountCents - totalPriceCents)

        // PASO 1: Intentar INSERT en gift_card_transactions (IDEMPOTENCIA REAL)
        // Si ya existe (gift_card_id, reference_id), el constraint único falla y sabemos que ya se procesó
        const { error: txError } = await supabase.from("gift_card_transactions").insert({
          gift_card_id: giftCard.id,
          user_id: finalUserId,
          reference_type: "bag_pass",
          reference_id: passId,
          amount: totalPriceCents,
          balance_before: previousAmountCents,
          balance_after: newAmountCents,
        })

        if (txError) {
          // Si el error es por constraint único, la transacción ya fue procesada
          if (txError.code === "23505") {
            console.log("[v0] Transaction already processed (idempotent), skipping balance update")
          } else {
            console.error("[v0] Error inserting transaction:", txError)
            // Continuar sin fallar - el pase ya fue creado
          }
        } else {
          // PASO 2: Solo si el INSERT fue exitoso, actualizar el saldo
          // .gte garantiza que no se descuente si otra transaccion ya bajo el saldo
          const { data: updatedRows, error: updateError } = await supabase
            .from("gift_cards")
            .update({
              amount: newAmountCents,
              status: newAmountCents <= 0 ? "used" : "partial",
              updated_at: new Date().toISOString(),
            })
            .eq("id", giftCard.id)
            .gte("amount", totalPriceCents)
            .select("id")

          if (updateError || !updatedRows || updatedRows.length === 0) {
            console.error("[v0] Error updating gift card balance:", updateError)
            // Revertir la transacción si no se pudo actualizar el saldo
            await supabase.from("gift_card_transactions").delete().eq("reference_id", passId)
            return NextResponse.json({ error: "Saldo insuficiente en la gift card" }, { status: 400 })
          }

          console.log("[v0] Gift card transaction recorded:", passId, previousAmountCents, "->", newAmountCents)
        }
      }
    }

    // Notificar al admin
    await supabase.from("admin_notifications").insert({
      type: "bag_pass_purchase",
      priority: "normal",
      title: `Compra de Pase - ${normalizedTier.toUpperCase()}`,
      message: `${profile.full_name || profile.email} compró ${quantity} pase(s) ${normalizedTier}`,
      metadata: {
        user_id: finalUserId,
        email: profile.email,
        pass_tier: normalizedTier,
        quantity,
        total_price: totalPrice,
        payment_method: paymentMethod || (giftCardCode ? "gift_card" : "stripe"),
        existing_membership: membership.membership_type, // Para referencia - NO cambiar
      },
    })

    console.log("[v0] Bag pass purchase successful")

    const firstPass = createdPasses?.[0]
    let autoReservationId: string | null = null

    // RESERVA AUTOMATICA: si la compra incluyó bagId, crear reserva ahora
    // Reutiliza misma logica RPC atomico (idempotente, transaccional, locks)
    if (bagId && firstPass?.id) {
      try {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 7) // 1 pase = 1 semana

        const { data: reservationId, error: rpcError } = await supabase.rpc(
          "create_reservation_atomic",
          {
            p_user_id: finalUserId,
            p_bag_id: bagId,
            p_pass_id: firstPass.id,
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
          }
        )

        if (rpcError) {
          if (rpcError.message?.includes("PASS_NOT_AVAILABLE")) {
            console.log("[v0] [purchase] reserva ya creada previamente (NO-OP)")
          } else {
            console.error("[v0] [purchase] RPC reserva FAILED", {
              bag_id: bagId,
              pass_id: firstPass.id,
              error: rpcError.message,
            })
          }
        } else {
          autoReservationId = reservationId
          console.log("[v0] [purchase] reserva auto creada OK", {
            reservation_id: reservationId,
            bag_id: bagId,
            pass_id: firstPass.id,
          })
        }
      } catch (resvErr: any) {
        console.error("[v0] [purchase] reserva auto exception (continua)", {
          error: resvErr?.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      bag_pass_id: firstPass?.id || null,
      pass_tier: dbTier,
      status: autoReservationId ? "used" : "available",
      reservation_id: autoReservationId,
      readyForReservation: !autoReservationId,
    })
  } catch (error) {
    console.error("Error purchasing passes:", error)
    return NextResponse.json({ error: "Error al procesar la compra" }, { status: 500 })
  }
}
