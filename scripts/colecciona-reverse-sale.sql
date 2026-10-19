-- Anulacion de venta Colecciona (desistimiento). Idempotente.
-- Guarda en el contrato archivado cuando y como se anulo (nota de credito y reembolso de Stripe).
ALTER TABLE public.colecciona_contracts ADD COLUMN IF NOT EXISTS reversed_at timestamptz;
ALTER TABLE public.colecciona_contracts ADD COLUMN IF NOT EXISTS reversal_credit_note_id text;
ALTER TABLE public.colecciona_contracts ADD COLUMN IF NOT EXISTS reversal_credit_note_number text;
ALTER TABLE public.colecciona_contracts ADD COLUMN IF NOT EXISTS reversal_refund_id text;
ALTER TABLE public.colecciona_contracts ADD COLUMN IF NOT EXISTS reversal_reason text;
