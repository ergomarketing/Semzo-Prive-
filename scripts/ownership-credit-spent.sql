-- Colecciona: el credito es SALDO DE LA SOCIA (2026-10-31).
-- Al comprar solo se gasta lo que se descuenta (max. 20 % del precio del bolso); el resto sigue siendo de la socia.
-- Hasta ahora una entrada estaba "gastada" si su progreso estaba 'completed'. Ahora se marca cada entrada con spent_at.
-- Aditivo y seguro: ejecutar ANTES de desplegar el codigo nuevo.

ALTER TABLE public.ownership_credit_entries ADD COLUMN IF NOT EXISTS spent_at timestamptz;

-- Entradas de ventas ya cerradas: gastadas (se conserva la fecha de la venta).
UPDATE public.ownership_credit_entries e
SET spent_at = COALESCE(p.completed_at, now())
FROM public.ownership_progress p
WHERE p.id = e.ownership_progress_id
  AND p.status = 'completed'
  AND e.spent_at IS NULL;

CREATE INDEX IF NOT EXISTS ownership_credit_entries_user_unspent_idx
  ON public.ownership_credit_entries (user_id)
  WHERE forfeited_at IS NULL AND spent_at IS NULL;
