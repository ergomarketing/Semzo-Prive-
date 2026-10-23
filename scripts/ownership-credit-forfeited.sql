-- El credito de Modo Colecciona es SALDO DE LA SOCIA: sobrevive a renunciar o cambiar de bolso y solo se pierde
-- con la baja de la membresia. forfeited_at marca el credito perdido (no se borra el historial). Idempotente.
ALTER TABLE public.ownership_credit_entries ADD COLUMN IF NOT EXISTS forfeited_at timestamptz;
CREATE INDEX IF NOT EXISTS ownership_credit_entries_user_open_idx ON public.ownership_credit_entries (user_id) WHERE forfeited_at IS NULL;
