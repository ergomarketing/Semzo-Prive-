-- Flujo de cargo SEPA rechazado (fondos insuficientes): aviso unico a la socia y pago manual desde su panel. Idempotente.
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS sepa_failure_email_sent_at timestamptz;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS sepa_manual_payment_session_id text;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS sepa_manual_paid_at timestamptz;
