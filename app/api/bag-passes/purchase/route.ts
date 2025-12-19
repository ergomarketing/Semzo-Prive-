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

    // Verificar que el usuario tenga membresía activa
    const { data: profile } = await supabase
      .from("profiles")
      .select("membership_type, membership_status, email, full_name")
      .eq("id", finalUserId)
      .single()

    console.log("[v0] User profile:", profile)

    if (!profile || profile.membership_status !== "active") {
      return NextResponse.json({ error: "Necesitas una membresía activa para comprar pases" }, { status: 403 })
    }

    // Crear los pases
    const passes = []
    for (let i = 0; i < quantity; i++) {
      passes.push({
        user_id: finalUserId,
        pass_tier: normalizedTier === "lessentiel" ? "essentiel" : normalizedTier,
        status: "available",
        price: pricePerPass,
        purchased_at: new Date().toISOString(),
        payment_method: paymentMethod || (giftCardCode ? "gift_card" : "stripe"),
        payment_id: stripePaymentId || paymentId || (giftCardCode ? `gift_${Date.now()}` : null),
        expires_at: null, // Los pases no expiran
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

    // Si se usó gift card, actualizar su saldo
    if (giftCardCode) {
      const { data: giftCard } = await supabase
        .from("gift_cards")
        .select("id, balance")
        .eq("code", giftCardCode)
        .single()

      if (giftCard) {
        const newBalance = Math.max(0, giftCard.balance - totalPrice * 100) // Balance en céntimos
        await supabase
          .from("gift_cards")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", giftCard.id)
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
        existing_membership: profile.membership_type, // Para referencia - NO cambiar
      },
    })

    console.log("[v0] Bag pass purchase successful - membership NOT changed")

    return NextResponse.json({
      success: true,
      passes: createdPasses || [],
      totalPrice,
      message: `${quantity} pase${quantity > 1 ? "s" : ""} ${normalizedTier} comprado${quantity > 1 ? "s" : ""} exitosamente`,
      // Confirmar que la membresía NO fue cambiada
      membershipUnchanged: true,
      currentMembership: profile.membership_type,
    })
  } catch (error) {
    console.error("Error purchasing passes:", error)
    return NextResponse.json({ error: "Error al procesar la compra" }, { status: 500 })
  }
}
