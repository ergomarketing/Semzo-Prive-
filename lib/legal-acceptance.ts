import type { SupabaseClient } from "@supabase/supabase-js"

interface RecordAcceptanceInput {
  userId: string
  context: string
  document: string
  documentVersion: string
  referenceId?: string | null
  textSnapshot?: string | null
  request?: Request
  metadata?: Record<string, unknown>
}

export function getClientIp(request?: Request): string | null {
  if (!request) return null
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip")
}

/** Guarda una aceptación legal. Devuelve el id del registro o null si falla. */
export async function recordLegalAcceptance(
  supabase: SupabaseClient,
  input: RecordAcceptanceInput,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("legal_acceptances")
    .insert({
      user_id: input.userId,
      context: input.context,
      document: input.document,
      document_version: input.documentVersion,
      reference_id: input.referenceId ?? null,
      text_snapshot: input.textSnapshot ?? null,
      ip_address: getClientIp(input.request),
      user_agent: input.request?.headers.get("user-agent") ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single()

  if (error) {
    console.error("[legal-acceptance] No se pudo guardar la aceptación:", error.message)
    return null
  }
  return data.id as string
}
