-- =====================================================================
-- AÑADIR COLUMNA cancellation_email_sent_at A user_memberships
-- Proposito: idempotencia del email de cancelacion (evitar duplicados
-- cuando Stripe envia tanto subscription.updated como subscription.deleted)
-- =====================================================================

ALTER TABLE user_memberships
ADD COLUMN IF NOT EXISTS cancellation_email_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN user_memberships.cancellation_email_sent_at IS
'Timestamp del envio del email de cancelacion. NULL = no enviado aun. Usado para idempotencia desde el webhook de Stripe.';
