import { createClient } from "@supabase/supabase-js"

type EmailLogStatus = "sent" | "failed" | "pending"

export interface LogEmailInput {
  recipientEmail: string
  subject: string
  emailType: string
  status: EmailLogStatus
  recipientName?: string | null
  errorMessage?: string | null
  resendId?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Registra un email en la tabla email_logs (para la sección Email Logs del admin).
 * Es best-effort: NUNCA lanza ni bloquea el envío real del email. Si el logging
 * falla, solo se registra en consola.
 */
export async function logEmail(input: LogEmailInput): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    await supabase.from("email_logs").insert({
      recipient_email: input.recipientEmail.toLowerCase().trim(),
      recipient_name: input.recipientName ?? null,
      subject: input.subject,
      email_type: input.emailType,
      status: input.status,
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
      error_message: input.errorMessage ?? null,
      resend_id: input.resendId ?? null,
      metadata: input.metadata ?? null,
    })
  } catch (e) {
    console.error("[email-logger] No se pudo registrar el email:", e)
  }
}
