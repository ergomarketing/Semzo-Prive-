import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { klaviyoConfigured } from "@/lib/klaviyo"
import { buildCensus, maskEmail, toKlaviyoProfile } from "@/lib/klaviyo-census"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const API_URL = "https://a.klaviyo.com/api"
const API_REVISION = "2024-10-15"

async function klaviyoPost(path: string, body: unknown): Promise<{ ok: boolean; status: number; text: string }> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_API_KEY}`,
      revision: API_REVISION,
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  })
  return { ok: response.ok, status: response.status, text: (await response.text().catch(() => "")).slice(0, 400) }
}

/**
 * GET /api/admin/klaviyo-census            -> PRUEBA EN SECO: cuenta contactos y muestra 5 (correo enmascarado). No envia nada.
 * GET /api/admin/klaviyo-census?confirmar=SI -> crea/actualiza los perfiles en Klaviyo (solo perfiles + propiedades).
 *
 * NO suscribe a nadie a marketing. Quien ya se dio de baja se marca (semzo_unsubscribed) y se suprime en Klaviyo.
 * Solo admin. Es idempotente: repetirlo actualiza los mismos perfiles, no los duplica.
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
  const census = await buildCensus(supabase)
  const entries = Array.from(census.values())

  const byOrigin: Record<string, number> = {}
  const byPlan: Record<string, number> = {}
  for (const e of entries) {
    for (const o of e.origins) byOrigin[o] = (byOrigin[o] || 0) + 1
    if (e.membershipStatus) {
      const key = `${e.membershipPlan || "?"}:${e.membershipStatus}`
      byPlan[key] = (byPlan[key] || 0) + 1
    }
  }
  const unsubscribed = entries.filter((e) => e.unsubscribed)

  const summary = {
    contactos_unicos: entries.length,
    por_origen: byOrigin,
    membresias: byPlan,
    dados_de_baja: unsubscribed.length,
    muestra: entries.slice(0, 5).map((e) => ({ email: maskEmail(e.email), ...toKlaviyoProfile(e).attributes.properties as object })),
  }

  if (request.nextUrl.searchParams.get("confirmar") !== "SI") {
    return NextResponse.json({
      modo: "prueba en seco: no se ha enviado nada a Klaviyo",
      klaviyo_configurado: klaviyoConfigured(),
      ...summary,
      siguiente_paso: "Si los numeros son correctos, abre la misma direccion añadiendo ?confirmar=SI",
    })
  }
  if (!klaviyoConfigured()) {
    return NextResponse.json({ error: "Falta KLAVIYO_PRIVATE_API_KEY en Vercel." }, { status: 400 })
  }

  const profiles = entries.map((e) => {
    const profile = toKlaviyoProfile(e)
    if (e.unsubscribed) (profile.attributes.properties as Record<string, unknown>).semzo_unsubscribed = true
    return profile
  })

  const results: Record<string, unknown> = {}
  const CHUNK = 500
  for (let i = 0; i < profiles.length; i += CHUNK) {
    const res = await klaviyoPost("/profile-bulk-import-jobs/", {
      data: { type: "profile-bulk-import-job", attributes: { profiles: { data: profiles.slice(i, i + CHUNK) } } },
    })
    results[`importacion_${i / CHUNK + 1}`] = res.ok ? `aceptada (${Math.min(CHUNK, profiles.length - i)} perfiles)` : `error ${res.status}: ${res.text}`
  }

  if (unsubscribed.length > 0) {
    const res = await klaviyoPost("/profile-suppression-bulk-create-jobs/", {
      data: {
        type: "profile-suppression-bulk-create-job",
        attributes: { profiles: { data: unsubscribed.map((e) => ({ type: "profile", attributes: { email: e.email } })) } },
      },
    })
    results.supresion_de_bajas = res.ok ? `aceptada (${unsubscribed.length})` : `error ${res.status}: ${res.text}`
  }

  return NextResponse.json({ modo: "IMPORTADO", ...summary, resultado: results })
}
