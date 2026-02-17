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
      quantity = 1,
      paymentMethod,
      stripePaymentId,
      giftCardCode,
      paymentId, // legacy
    } = body

    // Usar passTier o bagPassTier
    const tier = passTier || bagPassTier

    console.log("[v0] bag-passes/purchase received:", { userId, tier, quantity, paymentMethod, giftCardCode })

    // Validar tier
    const validTiers = ["essentiel", "lessentiel", "signature", "prive"]
    const normalizedTier = tier?.toLowerCase().replace(/^l'/, "").replace("'", "")

    if (!normalizedTier || !validTiers.includes(normalizedTier)) {
      return NextResponse.json({ error: "Tier de pase inválido" }, { status: 400 })
    }

    // Crear cliente Supabase con service role para operaciones admin
    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

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
      const sbClient = await getSupabaseServer()
      if (sbClient) {
        const {
          data: { user },
        } = await sbClient.auth.getUser()
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

    // VALIDACIÓN OBLIGATORIA: Verificar membresía activa
    // Check membership_intents (source of truth)
    const { data: activeIntent } = await supabase
      .from("membership_intents")
      .select("id, status, membership_type")
      .eq("user_id", finalUserId)
      .in("status", ["active", "paid_pending_verification"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Check user_memberships as secondary source
    const { data: userMembership } = await supabase
      .from("user_memberships")
      .select("status, membership_type")
      .eq("user_id", finalUserId)
      .maybeSingle()

    // Determinar si tiene membresía activa
    const hasActiveMembership =
      activeIntent?.status === "active" ||
      activeIntent?.status === "paid_pending_verification" ||
      userMembership?.status === "active"

    const effectiveMembershipType =
      activeIntent?.membership_type || userMembership?.membership_type

    console.log("[v0] User membership check:", {
      intent: activeIntent?.status,
      userMembership: userMembership?.status,
      hasActive: hasActiveMembership,
      effectiveType: effectiveMembershipType,
    })

    // REGLA INNEGOCIABLE: No se pueden comprar pases sin membresía activa
    if (!hasActiveMembership) {
      return NextResponse.json(
        { error: "Necesitas una membresía activa para comprar pases" }, 
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
        const previousAmount = giftCard.amount
        const newAmount = Math.max(0, previousAmount - totalPrice)

        // PASO 1: Intentar INSERT en gift_card_transactions (IDEMPOTENCIA REAL)
        // Si ya existe (gift_card_id, reference_id), el constraint único falla y sabemos que ya se procesó
        const { error: txError } = await supabase.from("gift_card_transactions").insert({
          gift_card_id: giftCard.id,
          user_id: finalUserId,
          reference_type: "bag_pass",
          reference_id: passId,
          amount: totalPrice,
          balance_before: previousAmount,
          balance_after: newAmount,
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
          const { error: updateError } = await supabase
            .from("gift_cards")
            .update({ amount: newAmount, updated_at: new Date().toISOString() })
            .eq("id", giftCard.id)
            .gte("amount", totalPrice)

          if (updateError) {
            console.error("[v0] Error updating gift card balance:", updateError)
            // Revertir la transacción si no se pudo actualizar el saldo
            await supabase.from("gift_card_transactions").delete().eq("reference_id", passId)
            return NextResponse.json({ error: "Saldo insuficiente en la gift card" }, { status: 400 })
          }

          console.log("[v0] Gift card transaction recorded:", passId, previousAmount, "->", newAmount)
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
        existing_membership: effectiveMembershipType, // Para referencia - NO cambiar
      },
    })

    console.log("[v0] Bag pass purchase successful")

    // Respuesta simple y clara - sin redirects, sin re-evaluar membresía
    const firstPass = createdPasses?.[0]
    return NextResponse.json({
      success: true,
      bag_pass_id: firstPass?.id || null,
      pass_tier: dbTier,
      status: "available",
      readyForReservation: true,
    })
  } catch (error) {
    console.error("Error purchasing passes:", error)
    return NextResponse.json({ error: "Error al procesar la compra" }, { status: 500 })
  }
}
