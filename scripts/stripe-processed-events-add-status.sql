-- Estado de procesamiento para eventos del webhook de Stripe.
-- Las filas existentes quedan como 'done' (default), que es lo que ya significaban.
-- APLICAR ANTES de desplegar el codigo que usa estas columnas.

ALTER TABLE stripe_processed_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'done',
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE stripe_processed_events
  DROP CONSTRAINT IF EXISTS stripe_processed_events_status_check;

ALTER TABLE stripe_processed_events
  ADD CONSTRAINT stripe_processed_events_status_check
  CHECK (status IN ('processing', 'done', 'failed'));

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_not_done
  ON stripe_processed_events (status, updated_at)
  WHERE status <> 'done';
