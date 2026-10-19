import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/** GET /api/admin/ownership/sales — ventas Colecciona cerradas (y las anuladas), de la mas reciente a la mas antigua. */
export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { data: contracts, error } = await supabaseAdmin
    .from("colecciona_contracts")
    .select(
      "ownership_progress_id, user_id, bag_id, created_at, stripe_invoice_id, reversed_at, reversal_credit_note_number, reversal_reason",
    )
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = Array.from(new Set((contracts || []).map((c) => c.user_id)))
  const bagIds = Array.from(new Set((contracts || []).map((c) => c.bag_id)))
  const progressIds = (contracts || []).map((c) => c.ownership_progress_id)
  const [{ data: profiles }, { data: bags }, { data: progress }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, full_name, email").in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]),
    supabaseAdmin.from("bags").select("id, brand, name, status").in("id", bagIds.length ? bagIds : ["00000000-0000-0000-0000-000000000000"]),
    supabaseAdmin.from("ownership_progress").select("id, purchase_price, status").in("id", progressIds.length ? progressIds : ["00000000-0000-0000-0000-000000000000"]),
  ])
  const profileById = new Map((profiles || []).map((p) => [p.id, p]))
  const bagById = new Map((bags || []).map((b) => [b.id, b]))
  const progressById = new Map((progress || []).map((p) => [p.id, p]))

  return NextResponse.json({
    sales: (contracts || []).map((c) => ({
      progress_id: c.ownership_progress_id,
      sold_at: c.created_at,
      member: profileById.get(c.user_id)?.full_name || profileById.get(c.user_id)?.email || c.user_id,
      email: profileById.get(c.user_id)?.email || null,
      bag: `${bagById.get(c.bag_id)?.brand || ""} ${bagById.get(c.bag_id)?.name || ""}`.trim(),
      price: progressById.get(c.ownership_progress_id)?.purchase_price ?? null,
      progress_status: progressById.get(c.ownership_progress_id)?.status ?? null,
      invoice_id: c.stripe_invoice_id,
      reversed_at: c.reversed_at,
      credit_note: c.reversal_credit_note_number,
      reason: c.reversal_reason,
    })),
  })
}
