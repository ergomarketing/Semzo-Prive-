-- Recogida a domicilio: franja elegida por la socia y confirmacion de Erika (ya pedida en Correos). Idempotente.
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_slot text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_confirmed_at timestamptz;
