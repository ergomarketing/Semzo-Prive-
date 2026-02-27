import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
