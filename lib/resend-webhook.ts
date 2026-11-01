import { createHmac, timingSafeEqual } from "crypto"

const TOLERANCE_SECONDS = 5 * 60
const MAX_REMEMBERED_EVENT_IDS = 20

export type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked"

export interface ResendWebhookEvent {
  type: string
  created_at?: string
  data?: {
    email_id?: string
    bounce?: { message?: string; type?: string; subType?: string }
    click?: { link?: string; timestamp?: string }
  }
}

export interface EmailLogRow {
  status: string
  sent_at: string | null
  error_message: string | null
  metadata: Record<string, unknown> | null
}

export interface EmailLogUpdate {
  status: string
  sent_at: string | null
  error_message: string | null
  metadata: Record<string, unknown>
}

/**
 * Verifica la firma Svix que usa Resend: HMAC-SHA256 de `${id}.${timestamp}.${body}`
 * con la clave base64 del signing secret ("whsec_...").
 */
export function verifyResendSignature(params: {
  payload: string
  svixId: string | null
  svixTimestamp: string | null
  svixSignature: string | null
  secret: string
}): boolean {
  const { payload, svixId, svixTimestamp, svixSignature, secret } = params
  if (!svixId || !svixTimestamp || !svixSignature) return false

  const timestamp = Number(svixTimestamp)
  if (!Number.isFinite(timestamp)) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > TOLERANCE_SECONDS) return false

  const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64")
  const expected = createHmac("sha256", key).update(`${svixId}.${svixTimestamp}.${payload}`).digest()

  return svixSignature.split(" ").some((entry) => {
    const [version, signature] = entry.split(",")
    if (version !== "v1" || !signature) return false
    const received = Buffer.from(signature, "base64")
    return received.length === expected.length && timingSafeEqual(received, expected)
  })
}

const STATUS_RANK: Record<string, number> = { pending: 0, sent: 1, delivered: 2 }

function promote(current: string, target: "sent" | "delivered", metadata: Record<string, unknown>): string {
  if (current === "failed" && metadata.bounced_at) return current
  return (STATUS_RANK[target] ?? 0) > (STATUS_RANK[current] ?? 0) ? target : current
}

/**
 * Calcula el nuevo estado de un email_log a partir de un evento de Resend.
 * Los eventos pueden llegar desordenados o repetidos, así que el estado solo avanza
 * (pending -> sent -> delivered) y un rebote siempre lo deja en "failed".
 * Devuelve null si el evento no aplica o ya se procesó (svix-id repetido).
 */
export function applyResendEvent(
  row: EmailLogRow,
  event: ResendWebhookEvent,
  svixId: string | null,
): EmailLogUpdate | null {
  const metadata: Record<string, unknown> = { ...(row.metadata ?? {}) }
  const seenIds = Array.isArray(metadata.webhook_event_ids) ? (metadata.webhook_event_ids as string[]) : []
  if (svixId && seenIds.includes(svixId)) return null

  const eventAt = event.created_at && !Number.isNaN(Date.parse(event.created_at)) ? new Date(event.created_at).toISOString() : new Date().toISOString()

  let status = row.status
  let sentAt = row.sent_at
  let errorMessage = row.error_message

  switch (event.type) {
    case "email.sent":
      status = promote(status, "sent", metadata)
      if (!sentAt) sentAt = eventAt
      break
    case "email.delivered":
      status = promote(status, "delivered", metadata)
      if (!sentAt) sentAt = eventAt
      metadata.delivered_at = metadata.delivered_at ?? eventAt
      break
    case "email.opened":
      status = promote(status, "delivered", metadata)
      metadata.opened_at = metadata.opened_at ?? eventAt
      metadata.open_count = Number(metadata.open_count ?? 0) + 1
      break
    case "email.clicked": {
      status = promote(status, "delivered", metadata)
      const clickedAt = event.data?.click?.timestamp ?? eventAt
      metadata.clicked_at = metadata.clicked_at ?? clickedAt
      metadata.click_count = Number(metadata.click_count ?? 0) + 1
      if (event.data?.click?.link) metadata.last_clicked_link = event.data.click.link
      break
    }
    case "email.bounced":
      status = "failed"
      errorMessage = event.data?.bounce?.message || "Rebote: el servidor del destinatario rechazó el email"
      metadata.bounced_at = metadata.bounced_at ?? eventAt
      if (event.data?.bounce?.type) metadata.bounce_type = event.data.bounce.type
      if (event.data?.bounce?.subType) metadata.bounce_subtype = event.data.bounce.subType
      break
    case "email.complained":
      status = promote(status, "delivered", metadata)
      metadata.complained_at = metadata.complained_at ?? eventAt
      break
    default:
      return null
  }

  metadata.last_event = event.type
  metadata.last_event_at = eventAt
  if (svixId) metadata.webhook_event_ids = [...seenIds, svixId].slice(-MAX_REMEMBERED_EVENT_IDS)

  return { status, sent_at: sentAt, error_message: errorMessage, metadata }
}

/** Traduce el último evento que Resend devuelve en GET /emails/{id} a eventos equivalentes. */
export function lastEventToEvents(lastEvent: string | null | undefined, createdAt?: string): ResendWebhookEvent[] {
  const at = createdAt
  switch (lastEvent) {
    case "sent":
      return [{ type: "email.sent", created_at: at }]
    case "delivered":
      return [{ type: "email.delivered", created_at: at }]
    case "opened":
      return [{ type: "email.delivered", created_at: at }, { type: "email.opened", created_at: at }]
    case "clicked":
      return [
        { type: "email.delivered", created_at: at },
        { type: "email.opened", created_at: at },
        { type: "email.clicked", created_at: at },
      ]
    case "bounced":
      return [{ type: "email.bounced", created_at: at }]
    case "suppressed":
      return [
        {
          type: "email.bounced",
          created_at: at,
          data: { bounce: { message: "Suprimido por Resend: la dirección tiene un rebote o queja previa", type: "Suppressed" } },
        },
      ]
    case "complained":
      return [{ type: "email.delivered", created_at: at }, { type: "email.complained", created_at: at }]
    default:
      return []
  }
}
