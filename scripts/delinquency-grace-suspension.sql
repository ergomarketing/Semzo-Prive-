-- Morosidad: inicio del impago (para el periodo de gracia y los avisos) y suspension del acceso. Idempotente.
ALTER TABLE public.user_memberships ADD COLUMN IF NOT EXISTS past_due_since timestamptz;
ALTER TABLE public.user_memberships ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
