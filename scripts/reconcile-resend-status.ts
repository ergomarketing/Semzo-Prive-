/**
 * Reconciliación única: consulta a Resend (GET /emails/{id}) el estado de los email_logs
 * de newsletter que siguen en "pending" y los actualiza con la misma lógica del webhook.
 *
 * Simulación (no escribe):  node --env-file=/vercel/share/.env.project --experimental-strip-types scripts/reconcile-resend-status.ts
 * Aplicar cambios:          ... scripts/reconcile-resend-status.ts --apply
 */
import { createClient } from "@supabase/supabase-js"
import { applyResendEvent, lastEventToEvents, type EmailLogRow } from "../lib/resend-webhook.ts"

const APPLY = process.argv.includes("--apply")
const DELAY_MS = 250

const apiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY
if (!apiKey) throw new Error("Falta EMAIL_API_KEY / RESEND_API_KEY")

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchResendEmail(id: string, attempt = 0): Promise<{ last_event?: string; created_at?: string } | null> {
  const response = await fetch(`https://api.resend.com/emails/${id}`, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (response.status === 429 && attempt < 3) {
    await sleep(1500 * (attempt + 1))
    return fetchResendEmail(id, attempt + 1)
  }
  if (!response.ok) return null
  return response.json()
}

const { data: rows, error } = await supabase
  .from("email_logs")
  .select("id, resend_id, status, sent_at, error_message, metadata")
  .eq("email_type", "newsletter_campaign")
  .eq("status", "pending")
  .not("resend_id", "is", null)
  .order("created_at", { ascending: true })
  .limit(1000)

if (error) throw error
console.log(`${APPLY ? "APLICANDO" : "SIMULACIÓN"}: ${rows?.length ?? 0} registros pending con resend_id`)

const summary: Record<string, number> = {}
for (const row of rows ?? []) {
  const email = await fetchResendEmail(row.resend_id as string)
  await sleep(DELAY_MS)

  if (!email?.last_event) {
    summary["sin respuesta de Resend"] = (summary["sin respuesta de Resend"] ?? 0) + 1
    continue
  }

  const eventTime = (row.metadata as Record<string, unknown> | null)?.scheduled_at as string | undefined ?? email.created_at
  let current: EmailLogRow = { status: row.status, sent_at: row.sent_at, error_message: row.error_message, metadata: row.metadata }
  for (const event of lastEventToEvents(email.last_event, eventTime)) {
    const update = applyResendEvent(current, event, null)
    if (update) current = update
  }

  const label = `${email.last_event} -> ${current.status}`
  summary[label] = (summary[label] ?? 0) + 1

  if (APPLY && current.status !== row.status) {
    const { error: updateError } = await supabase
      .from("email_logs")
      .update({ status: current.status, sent_at: current.sent_at, error_message: current.error_message, metadata: current.metadata })
      .eq("id", row.id)
    if (updateError) console.error("Error actualizando", row.id, updateError.message)
  }
}

console.table(summary)
