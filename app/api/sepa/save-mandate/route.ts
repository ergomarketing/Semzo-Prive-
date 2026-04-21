import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase"

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

    // Guardar el payment method SEPA en el perfil
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        sepa_payment_method_id: paymentMethodId,
        sepa_mandate_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      console.error("[SEPA Save Mandate] Error:", error)
      return NextResponse.json({ error: "Error guardando mandato" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[SEPA Save Mandate] Error:", error)
    return NextResponse.json({ error: error.message || "Error inesperado" }, { status: 500 })
  }
}
