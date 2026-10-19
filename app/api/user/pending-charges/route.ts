import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * GET /api/user/pending-charges
 * Cargos por no devolucion que el banco RECHAZO y siguen sin pagar (la socia debe completarlos a mano).
 * Solo lectura; solo las de la socia autenticada.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await admin
    .from("reservations")
    .select("id, sepa_charge_amount, sepa_charge_failed_at, bags(brand, name)")
    .eq("user_id", user.id)
    .not("sepa_charge_failed_at", "is", null)
    .is("sepa_charged_at", null)
    .is("sepa_manual_paid_at", null)
    .gt("sepa_charge_amount", 0)
    .order("sepa_charge_failed_at", { ascending: false })

  const charges = (data || []).map((row) => {
    const bag = (Array.isArray(row.bags) ? row.bags[0] : row.bags) as { brand?: string; name?: string } | null
    return {
      reservation_id: row.id,
      amount: Number(row.sepa_charge_amount) || 0,
      failed_at: row.sepa_charge_failed_at,
      bag: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "tu bolso",
    }
  })
  return NextResponse.json({ charges })
}
