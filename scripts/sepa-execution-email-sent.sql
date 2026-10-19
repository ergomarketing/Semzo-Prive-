-- Marca de envio del correo 'cargo SEPA ejecutado' (se manda solo cuando Stripe confirma el cobro). Idempotente.
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS sepa_execution_email_sent_at timestamptz;
