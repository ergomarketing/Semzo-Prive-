-- Columnas informativas del metodo de pago de la membresia (idempotente).
-- Ya ejecutado en produccion el 2026-10-16; este script deja constancia y sirve para otros entornos.
ALTER TABLE public.user_memberships
  ADD COLUMN IF NOT EXISTS payment_method_last4 VARCHAR(4),
  ADD COLUMN IF NOT EXISTS payment_method_brand VARCHAR(20);
