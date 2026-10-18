import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { loadPurchaseContext } from "@/lib/ownership-purchase-data"
import { normalizeSpanishId } from "@/lib/spanish-id"
import {
  COLECCIONA_ANNEX_PHRASE,
  COLECCIONA_CONDITIONS_VERSION,
  COLECCIONA_CONTRACT_VERSION,
  buildAnnexBlocks,
  buildContractMainBlocks,
  buildWithdrawalFormBlocks,
} from "@/lib/colecciona-legal"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/user/ownership/purchase-preview
 *
 * Todo lo que la socia ve ANTES de pagar: importes, contrato con sus datos, Anexo I (estado del
 * bolso y fotos) y que aceptaciones faltan. Si el bolso aun no tiene la ficha del estado completa,
 * ready = false y la compra no se puede iniciar (el admin la rellena en Inventario).
 */
export async function GET() {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const loaded = await loadPurchaseContext(supabaseAdmin, user.id)
    if (!loaded.ok) return NextResponse.json({ error: loaded.message, code: loaded.code }, { status: 404 })
    const { context } = loaded

    const sold = context.bag.status === "colecciona"
    const reportComplete = !!context.report

    // Ficha incompleta: avisar a la admin (como mucho una vez cada 24 h por bolso).
    if (!reportComplete && !sold) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: already } = await supabaseAdmin
        .from("admin_notifications")
        .select("id")
        .eq("type", "colecciona_report_missing")
        .gte("created_at", since)
        .contains("metadata", { bag_id: context.bag.id })
        .limit(1)
      if (!already || already.length === 0) {
        await supabaseAdmin.from("admin_notifications").insert({
          type: "colecciona_report_missing",
          priority: "high",
          title: `Falta la ficha del estado para vender ${context.bag.brand} ${context.bag.name}`.trim(),
          message: `${context.member.full_name} ha abierto la compra de ${context.bag.brand} ${context.bag.name} en Colecciona, pero la ficha del estado (Anexo I) no está completa. Rellénala en Inventario → editar bolso → Modo Colecciona.`,
          metadata: { user_id: user.id, bag_id: context.bag.id },
        })
      }
    }

    return NextResponse.json({
      ready: reportComplete && !sold,
      reason: sold ? "already_sold" : reportComplete ? null : "condition_report_missing",
      bag_label: `${context.bag.brand} ${context.bag.name}`.trim(),
      amounts: context.amounts,
      needs_document: !normalizeSpanishId(context.member.document_number).ok,
      conditions_accepted: context.conditionsAccepted,
      conditions_version: COLECCIONA_CONDITIONS_VERSION,
      contract_version: COLECCIONA_CONTRACT_VERSION,
      annex_phrase: COLECCIONA_ANNEX_PHRASE,
      contract_blocks: reportComplete ? buildContractMainBlocks(context.vars) : [],
      annex_blocks: reportComplete ? buildAnnexBlocks(context.vars) : [],
      withdrawal_blocks: reportComplete ? buildWithdrawalFormBlocks() : [],
      photos: context.bag.images.slice(0, 8),
    })
  } catch (err) {
    console.error("[colecciona-preview] error:", err)
    return NextResponse.json({ error: "No se pudo preparar la compra" }, { status: 500 })
  }
}
