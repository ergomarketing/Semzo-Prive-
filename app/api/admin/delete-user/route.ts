import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

/**
 * Cancela todas las suscripciones activas del cliente en Stripe.
 * Devuelve resumen de lo cancelado para auditoria.
 */
async function cancelStripeSubscriptionsForUser(supabaseAdmin: any, targetUserId: string) {
  const result: {
    customerId: string | null
    subscriptionsFound: number
    subscriptionsCancelled: string[]
    errors: string[]
  } = {
    customerId: null,
    subscriptionsFound: 0,
    subscriptionsCancelled: [],
    errors: [],
  }

  try {
    // 1. Buscar stripe_customer_id en user_memberships (fuente de verdad)
    const { data: memberships } = await supabaseAdmin
      .from("user_memberships")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", targetUserId)

    let customerId: string | null = null
    const subscriptionIds = new Set<string>()

    if (memberships && memberships.length > 0) {
      for (const m of memberships) {
        if (m.stripe_customer_id && !customerId) customerId = m.stripe_customer_id
        if (m.stripe_subscription_id) subscriptionIds.add(m.stripe_subscription_id)
      }
    }

    // 2. Fallback: buscar customer_id en profiles
    if (!customerId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", targetUserId)
        .maybeSingle()
      if (profile?.stripe_customer_id) customerId = profile.stripe_customer_id
    }

    result.customerId = customerId

    // 3. Si tenemos customer, listar TODAS sus suscripciones en Stripe
    if (customerId) {
      const allSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      })
      for (const s of allSubs.data) {
        if (s.status !== "canceled" && s.status !== "incomplete_expired") {
          subscriptionIds.add(s.id)
        }
      }
    }

    result.subscriptionsFound = subscriptionIds.size

    // 4. Cancelar cada suscripcion inmediatamente
    for (const subId of subscriptionIds) {
      try {
        await stripe.subscriptions.cancel(subId, {
          invoice_now: false,
          prorate: false,
        })
        result.subscriptionsCancelled.push(subId)
        console.log(`[DELETE-USER] Stripe subscription cancelada: ${subId}`)
      } catch (err: any) {
        // Si ya estaba cancelada, no es error
        if (err?.code === "resource_missing" || err?.message?.includes("canceled")) {
          console.log(`[DELETE-USER] Suscripcion ${subId} ya estaba cancelada`)
          result.subscriptionsCancelled.push(subId)
        } else {
          console.error(`[DELETE-USER] Error cancelando ${subId}:`, err.message)
          result.errors.push(`${subId}: ${err.message}`)
        }
      }
    }
  } catch (err: any) {
    console.error("[DELETE-USER] Error general en cancelacion Stripe:", err)
    result.errors.push(err.message)
  }

  return result
}

/**
 * API para eliminar usuarios de forma segura
 * Maneja todas las foreign key constraints en el orden correcto
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[DELETE-USER] === INICIO ELIMINACIÓN SEGURA ===")

    const body = await request.json()
    const { userId, phone, email } = body

    if (!userId && !phone && !email) {
      return NextResponse.json(
        { error: "Se requiere userId, phone o email para identificar al usuario" },
        { status: 400 },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let targetUserId = userId
    let userInfo = { phone: phone || null, email: email || null, id: userId || null }

    // Si no tenemos el ID, buscarlo por email o phone
    if (!targetUserId) {
      if (email) {
        console.log("[DELETE-USER] Buscando usuario por email:", email)
        const { data: authUser, error: emailError } = await supabaseAdmin.auth.admin.listUsers()
        const foundUser = authUser?.users?.find((u) => u.email === email)
        if (foundUser) {
          targetUserId = foundUser.id
          userInfo = { email: foundUser.email, phone: foundUser.phone, id: foundUser.id }
        }
      } else if (phone) {
        console.log("[DELETE-USER] Buscando usuario por phone:", phone)
        const { data: authUser, error: phoneError } = await supabaseAdmin.auth.admin.listUsers()
        const foundUser = authUser?.users?.find((u) => u.phone === phone)
        if (foundUser) {
          targetUserId = foundUser.id
          userInfo = { email: foundUser.email, phone: foundUser.phone, id: foundUser.id }
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    console.log("[DELETE-USER] Usuario identificado:", userInfo)

    // PASO 0 (CRITICO): Cancelar suscripciones en Stripe ANTES de borrar nada en BD
    // Si fallan estas cancelaciones, abortamos para evitar cobros huerfanos.
    console.log("[DELETE-USER] Cancelando suscripciones de Stripe...")
    const stripeCleanup = await cancelStripeSubscriptionsForUser(supabaseAdmin, targetUserId)
    console.log("[DELETE-USER] Resultado Stripe:", stripeCleanup)

    if (stripeCleanup.errors.length > 0 && stripeCleanup.subscriptionsCancelled.length < stripeCleanup.subscriptionsFound) {
      return NextResponse.json(
        {
          error: "No se pudieron cancelar todas las suscripciones de Stripe. Cancelacion abortada para evitar cobros huerfanos.",
          stripeCleanup,
        },
        { status: 500 },
      )
    }

    // ORDEN DE ELIMINACIÓN: de más dependiente a menos dependiente
    const deletionOrder = [
      { table: "shipment_notifications", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "admin_notifications", column: "user_id" },
      { table: "admin_alerts", column: "user_id" },
      { table: "waitlist", column: "user_id" },
      { table: "wishlists", column: "user_id" },
      { table: "wishlist", column: "user_id" }, // Alias alternativo
      { table: "bag_passes", column: "user_id" },
      { table: "newsletter_subscriptions", column: "user_id" },
      { table: "addresses", column: "user_id" },
      { table: "membership_history", column: "user_id" },
      { table: "audit_log", column: "user_id" },
      { table: "identity_verifications", column: "user_id" },
      { table: "gift_cards", column: "user_id" },
      { table: "gift_card_transactions", column: "user_id" },
      { table: "payment_history", column: "user_id" },
      { table: "reservations", column: "user_id" },
      { table: "subscriptions", column: "user_id" },
      { table: "user_memberships", column: "user_id" },
      { table: "pending_memberships", column: "user_id" },
    ]

    const deletionResults: any[] = []

    // Eliminar de cada tabla en orden
    for (const { table, column, usePhone } of deletionOrder) {
      try {
        let query = supabaseAdmin.from(table).delete()

        if (usePhone && userInfo.phone) {
          query = query.eq(column, userInfo.phone)
        } else {
          query = query.eq(column, targetUserId)
        }

        const { error, count } = await query

        if (error) {
          // Si la tabla no existe o no tiene RLS configurado, continuar
          if (error.code === "42P01" || error.message.includes("does not exist")) {
            console.log(`[DELETE-USER] Tabla ${table} no existe, omitiendo...`)
            deletionResults.push({ table, status: "not_exists", deleted: 0 })
            continue
          }
          console.warn(`[DELETE-USER] Warning en ${table}:`, error.message)
          deletionResults.push({ table, status: "error", error: error.message })
        } else {
          console.log(`[DELETE-USER] ✓ Eliminados registros de ${table}`)
          deletionResults.push({ table, status: "success", deleted: count || 0 })
        }
      } catch (err: any) {
        console.warn(`[DELETE-USER] Excepción en ${table}:`, err.message)
        deletionResults.push({ table, status: "exception", error: err.message })
      }
    }

    // Eliminar perfil
    console.log("[DELETE-USER] Eliminando perfil...")
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", targetUserId)

    if (profileError) {
      console.error("[DELETE-USER] Error eliminando perfil:", profileError)
      return NextResponse.json(
        {
          error: "Error eliminando perfil de usuario",
          details: profileError.message,
          partialResults: deletionResults,
        },
        { status: 500 },
      )
    }

    console.log("[DELETE-USER] ✓ Perfil eliminado")

    // Finalmente, eliminar de auth.users
    console.log("[DELETE-USER] Eliminando de auth.users...")
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    if (authError) {
      console.error("[DELETE-USER] Error eliminando auth.users:", authError)
      return NextResponse.json(
        {
          error: "Error eliminando usuario de autenticación",
          details: authError.message,
          partialResults: deletionResults,
        },
        { status: 500 },
      )
    }

    console.log("[DELETE-USER] ✓ Usuario eliminado completamente")
    console.log("[DELETE-USER] === ELIMINACIÓN COMPLETADA ===")

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado exitosamente",
      userInfo,
      stripeCleanup,
      deletionResults,
    })
  } catch (error: any) {
    console.error("[DELETE-USER] Error inesperado:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
