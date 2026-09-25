import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@/lib/supabase"
import { sanitizeAttribution, saveAttribution } from "@/lib/attribution"

/**
 * POST /api/attribution
 *
 * Respaldo de la atribucion de registro para altas que NO pasan por
 * /api/auth/register (SMS, confirmacion de email en otro dispositivo...).
 * Lo invoca AttributionCapture cuando hay sesion y aun no se ha enviado.
 *
 * Solo acepta cuentas RECIEN creadas (<72h): un cliente antiguo que inicia
 * sesion hoy no debe recibir como "origen" la visita de hoy. Idempotente: la
 * primera escritura gana.
 *
 * Body: { attribution: { firstTouch, lastTouch } }
 *   200 { ok: true, channel }
 *   400 { ok: false, reason: "empty" }
 *   401 { ok: false, reason: "unauthorized" }
 *   409 { ok: false, reason: "account_too_old" }
 */
const MAX_ACCOUNT_AGE_MS = 72 * 60 * 60 * 1000

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

    // Aqui solo aceptamos la parte automatica; la respuesta declarada
    // (selfReported) solo se toma del formulario de registro.
    const parsed = sanitizeAttribution(body?.attribution)
    const payload = { ...parsed, selfReported: null, selfReportedDetail: null }
    if (!payload.firstTouch && !payload.lastTouch) {
      return NextResponse.json({ ok: false, reason: "empty" }, { status: 400 })
    }

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const result = await saveAttribution(supabaseService, user.id, payload)
    // Fallo de BD (p.ej. tabla sin migrar) -> 500: el cliente NO lo marca como
    // enviado y reintenta en la siguiente carga. Es acotado (solo cuentas <72h)
    // y se autocura en cuanto exista la tabla.
    return NextResponse.json({ ok: result.ok, channel: result.channel }, { status: result.ok ? 200 : 500 })
  } catch (err) {
    console.error("[attribution] Error en /api/attribution:", err)
    return NextResponse.json({ ok: false, reason: "internal_error" }, { status: 500 })
  }
}
