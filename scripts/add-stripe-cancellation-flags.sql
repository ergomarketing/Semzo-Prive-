-- =============================================================================
-- Sincronizacion Stripe ↔ user_memberships
-- =============================================================================
-- Anade columnas para reflejar exactamente el estado de cancelacion de Stripe:
--   * cancel_at_period_end: Stripe.Subscription.cancel_at_period_end
--   * canceled_at:          Stripe.Subscription.canceled_at (timestamp UTC)
--   * current_period_end:   Stripe.Subscription.current_period_end (cache local
--                           para evitar consultar Stripe en cada peticion)
--
-- Importante:
--   - NO eliminamos ni renombramos columnas existentes (status, end_date,
--     can_make_reservations). Esas siguen siendo la fuente de verdad LOCAL.
--   - Estas columnas son SOLO un mirror de Stripe para auditoria y
--     reconciliacion. La logica de elegibilidad sigue usando
--     can_make_reservations + end_date.
-- =============================================================================

ALTER TABLE public.user_memberships
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ NULL;

-- Indice parcial: localizar rapido membresias canceladas con acceso vigente
-- (las que vencen pronto y necesitan downgrade automatico).
CREATE INDEX IF NOT EXISTS idx_user_memberships_cancel_pending
  ON public.user_memberships (current_period_end)
  WHERE cancel_at_period_end = TRUE;

COMMENT ON COLUMN public.user_memberships.cancel_at_period_end IS
  'Espejo de Stripe.Subscription.cancel_at_period_end. NO usar como gate de eligibilidad: usar can_make_reservations + end_date.';

COMMENT ON COLUMN public.user_memberships.canceled_at IS
  'Timestamp en que Stripe registro la cancelacion (Stripe.Subscription.canceled_at).';

COMMENT ON COLUMN public.user_memberships.current_period_end IS
  'Cache de Stripe.Subscription.current_period_end. Util para reconciliar end_date sin llamar a Stripe.';
