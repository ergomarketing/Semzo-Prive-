/**
 * Consentimiento de marketing por correo (casilla expresa, nunca premarcada).
 *
 * Guarda la PRUEBA (texto exacto aceptado, fecha, IP, navegador) en marketing_consents y suscribe el
 * correo a la lista de marketing de Klaviyo. Solo se llama cuando la persona ha marcado la casilla.
 * Nunca lanza: un fallo de Klaviyo no debe impedir el registro ni el acceso al catalogo; el
 * consentimiento queda guardado igualmente y se puede reenviar a Klaviyo despues.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { getClientIp } from "@/lib/legal-acceptance"
import { klaviyoSubscribe } from "@/lib/klaviyo"
import { MARKETING_CONSENT_TEXT } from "@/lib/marketing-consent-text"

export async function recordMarketingConsent(
  supabase: SupabaseClient,
  input: {
    email: string
    userId?: string | null
    /** Donde se dio el consentimiento: catalog_gate, signup, signup_free... */
    source: string
    locale?: string | null
    firstName?: string | null
    lastName?: string | null
    request?: Request
  },
): Promise<{ recorded: boolean; subscribed: boolean }> {
  const email = (input.email || "").toLowerCase().trim()
  if (!email || !email.includes("@")) return { recorded: false, subscribed: false }

  const locale: "es" | "en" = input.locale === "en" ? "en" : "es"
  let recordId: string | null = null
  try {
    const { data, error } = await supabase
      .from("marketing_consents")
      .insert({
        email,
        user_id: input.userId ?? null,
        source: input.source,
        consent_text: MARKETING_CONSENT_TEXT[locale],
        locale,
        ip_address: getClientIp(input.request),
        user_agent: input.request?.headers.get("user-agent") ?? null,
      })
      .select("id")
      .single()
    if (error) throw error
    recordId = data?.id ?? null
  } catch (err) {
    console.error("[marketing-consent] No se pudo guardar el consentimiento:", err)
    // Sin prueba guardada NO se suscribe: no hay consentimiento demostrable.
    return { recorded: false, subscribed: false }
  }

  const result = await klaviyoSubscribe({
    email,
    source: input.source,
    firstName: input.firstName,
    lastName: input.lastName,
  })
  if (result.ok && recordId) {
    await supabase.from("marketing_consents").update({ klaviyo_synced_at: new Date().toISOString() }).eq("id", recordId)
  }
  return { recorded: true, subscribed: result.ok }
}
