import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@/lib/supabase"
import { sanitizeAttribution, saveAttribution } from "@/lib/attribution"

/**
 * POST /api/attribution/answer
 *
 * Respuesta de un toque a "¿Como nos conociste?" desde el dashboard, para las
 * compradoras que se registraron sin pasar por el formulario de /signup (carrito,
 * SMS...). Solo cuentas de <30 dias. Idempotente: no pisa una respuesta previa.
 *
 * Body: { selfReported, selfReportedDetail?, attribution?: { firstTouch, lastTouch } }
 *   200 { ok: true }
 *   400 { ok: false, reason: "invalid_option" }
 *   401 { ok: false, reason: "unauthorized" }
 *   409 { ok: false, reason: "account_too_old" | "already_answered" }
 *   500 { ok: false, reason: "db_error" | "internal_error" }
 *
 * Si la fila ya existe (creada por el registro o el respaldo automatico) solo se
 * rellena la parte declarada: canal y touches automaticos no se tocan. Si no
 * existe, se crea con los touches que envie el navegador.
 */
const MAX_ACCOUNT_AGE_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
    }

    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
    if (!createdAt || Date.now() - createdAt > MAX_ACCOUNT_AGE_MS) {
      return NextResponse.json({ ok: false, reason: "account_too_old" }, { status: 409 })
    }

    const payload = sanitizeAttribution({
      selfReported: body?.selfReported,
      selfReportedDetail: body?.selfReportedDetail,
      firstTouch: body?.attribution?.firstTouch,
      lastTouch: body?.attribution?.lastTouch,
    })
    if (!payload.selfReported) {
      return NextResponse.json({ ok: false, reason: "invalid_option" }, { status: 400 })
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    })

    const { data: existing, error: selectError } = await admin
      .from("signup_attribution")
      .select("self_reported")
      .eq("user_id", user.id)
      .maybeSingle()

    if (selectError) {
      console.error("[attribution] answer select error:", selectError.message)
      return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 })
    }

    if (existing?.self_reported) {
      return NextResponse.json({ ok: false, reason: "already_answered" }, { status: 409 })
    }

    if (existing) {
      const { error: updateError } = await admin
        .from("signup_attribution")
        .update({ self_reported: payload.selfReported, self_reported_detail: payload.selfReportedDetail })
        .eq("user_id", user.id)
      if (updateError) {
        console.error("[attribution] answer update error:", updateError.message)
        return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    const saved = await saveAttribution(admin, user.id, payload)
    if (!saved.ok) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[attribution] Error en /api/attribution/answer:", err)
    return NextResponse.json({ ok: false, reason: "internal_error" }, { status: 500 })
  }
}
