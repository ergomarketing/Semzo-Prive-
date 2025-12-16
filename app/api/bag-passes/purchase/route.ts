import { getSupabaseServer } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer()

    if (!supabase) {
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { passTier, quantity = 1 } = body

    // Validar tier
    const validTiers = ["lessentiel", "signature", "prive"]
    if (!validTiers.includes(passTier)) {
      return NextResponse.json({ error: "Tier de pase inválido" }, { status: 400 })
    }

    // Precios de pases según tier
    const passPrices = {
      lessentiel: 15.0,
      signature: 25.0,
      prive: 40.0,
    }

    const pricePerPass = passPrices[passTier as keyof typeof passPrices]
    const totalPrice = pricePerPass * quantity

    // Verificar que el usuario tenga membresía activa
    const { data: profile } = await supabase
      .from("profiles")
      .select("membership_type, membership_status")
      .eq("id", user.id)
      .single()

    if (!profile || profile.membership_status !== "active") {
      return NextResponse.json({ error: "Necesitas una membresía activa para comprar pases" }, { status: 403 })
    }

    // Crear los pases
    const passes = []
    for (let i = 0; i < quantity; i++) {
      passes.push({
        user_id: user.id,
        pass_tier: passTier,
        status: "available",
        price: pricePerPass,
        purchased_at: new Date().toISOString(),
        // Los pases no expiran a menos que se especifique
        expires_at: null,
      })
    }

    const { data: createdPasses, error: insertError } = await supabase.from("bag_passes").insert(passes).select()

    if (insertError) {
      console.error("Error creating passes:", insertError)
      return NextResponse.json({ error: "Error al crear los pases" }, { status: 500 })
    }

    // Actualizar contador de pases disponibles en profile
    const { data: passCount } = await supabase.rpc("count_available_passes", { p_user_id: user.id })

    if (passCount !== null) {
      await supabase.from("profiles").update({ available_passes_count: passCount }).eq("id", user.id)
    }

    return NextResponse.json({
      success: true,
      passes: createdPasses,
      totalPrice,
      message: `${quantity} pase${quantity > 1 ? "s" : ""} ${passTier} comprado${quantity > 1 ? "s" : ""} exitosamente`,
    })
  } catch (error) {
    console.error("Error purchasing passes:", error)
    return NextResponse.json({ error: "Error al procesar la compra" }, { status: 500 })
  }
}
