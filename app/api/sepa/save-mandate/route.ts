import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase"
import { adminNotifications } from "@/lib/admin-notifications"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

// Normaliza un nombre para comparar: sin acentos, minúsculas, solo palabras
function normalizeName(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

// Coincide si comparten al menos 2 palabras (o todas, si el nombre tiene 1) — tolera
// orden distinto, apellidos compuestos, o solo nombre+1 apellido en la cuenta SEPA.
function namesLikelyMatch(nameA: string, nameB: string): boolean {
  const wordsA = new Set(normalizeName(nameA))
  const wordsB = normalizeName(nameB)
  if (wordsA.size === 0 || wordsB.length === 0) return true // sin datos suficientes, no bloquear
  const overlap = wordsB.filter((w) => wordsA.has(w)).length
  const required = Math.min(2, Math.min(wordsA.size, wordsB.length))
  return overlap >= required
}

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 8b del flujo de suscripcion: GUARDAR MANDATO SEPA
 *
 * Recibe el paymentMethodId generado tras confirmSepaDebitSetup y lo persiste
 * en profiles.sepa_payment_method_id + sepa_mandate_accepted_at.
 *
 * Este endpoint es llamado DESPUES de que Stripe confirme el SetupIntent,
 * y ANTES de /api/memberships/activate. Si falla, el usuario ve error y no
 * se activa la membresia (el front valida mandateRes.ok).
 *
 * BLINDAJE ANTIFRAUDE: además de guardar el mandato, se compara el nombre del
 * titular de la cuenta SEPA (billing_details.name en Stripe) contra el nombre
 * verificado por identidad (Stripe Identity). Si no coinciden, se guarda como
 * "mismatch" y se avisa al admin — el mandato SEPA es nuestro seguro frente a
 * bolsos no devueltos, así que debe pertenecer a la misma persona verificada.
 * No se bloquea la activación en el momento (podría ser una variación legítima
 * del nombre), pero el caso queda marcado para revisión manual.
 * ============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { paymentMethodId } = await request.json()

    if (!paymentMethodId) {
      return NextResponse.json({ error: "paymentMethodId requerido" }, { status: 400 })
    }

    // Obtener el nombre del titular de la cuenta SEPA directamente desde Stripe
    let sepaHolderName: string | null = null
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
      sepaHolderName = paymentMethod.billing_details?.name || paymentMethod.sepa_debit?.bank_code
        ? paymentMethod.billing_details?.name || null
        : null
    } catch (stripeError: any) {
      console.error("[SEPA Save Mandate] Error obteniendo payment method de Stripe:", stripeError.message)
    }

    // Nombre verificado por identidad (fuente de verdad: profiles.full_name,
    // solo tiene valor real de comparación si identity_verified = true)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, first_name, last_name, email, identity_verified")
      .eq("id", user.id)
      .maybeSingle()

    const verifiedName =
      profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || null

    let sepaNameMatchStatus: "match" | "mismatch" | "not_checked" = "not_checked"
    if (profile?.identity_verified && verifiedName && sepaHolderName) {
      sepaNameMatchStatus = namesLikelyMatch(verifiedName, sepaHolderName) ? "match" : "mismatch"
    }

    // Guardar el payment method SEPA en el perfil
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        sepa_payment_method_id: paymentMethodId,
        sepa_mandate_accepted_at: new Date().toISOString(),
        sepa_holder_name: sepaHolderName,
        sepa_name_match_status: sepaNameMatchStatus,
        sepa_name_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("[SEPA Save Mandate] Error:", error)
      return NextResponse.json({ error: "Error guardando mandato" }, { status: 500 })
    }

    if (sepaNameMatchStatus === "mismatch") {
      console.warn(
        `[SEPA Save Mandate] MISMATCH: usuario ${user.id} — identidad "${verifiedName}" vs titular SEPA "${sepaHolderName}"`,
      )
      await adminNotifications
        .notifySepaNameMismatch({
          userId: user.id,
          userEmail: profile?.email || "desconocido",
          verifiedName: verifiedName || "desconocido",
          sepaHolderName: sepaHolderName || "desconocido",
        })
        .catch((e) => console.error("[SEPA Save Mandate] Error notificando admin:", e))
    }

    return NextResponse.json({ success: true, sepaNameMatchStatus })
  } catch (error: any) {
    console.error("[SEPA Save Mandate] Error:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}
