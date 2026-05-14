-- Tabla y funciones para el sistema de canje de credito de referidos.
-- Auditoria completa + funcion atomica que valida saldo y reserva el canje
-- ANTES de llamar a Stripe. Aislado del sistema de pagos principal.

-- 1) Tabla de canjes (auditoria + idempotencia)
CREATE TABLE IF NOT EXISTS referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_euros INTEGER NOT NULL CHECK (amount_euros > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'failed', 'reverted')),
  stripe_customer_id TEXT,
  stripe_balance_tx_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON referral_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON referral_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_created ON referral_redemptions(created_at DESC);

-- 2) Bloquea concurrencia (un canje activo a la vez por usuario).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_redemption_pending_per_user
  ON referral_redemptions(user_id)
  WHERE status = 'pending';

-- 3) RLS: la socia ve sus canjes, el admin todos.
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own redemptions" ON referral_redemptions;
CREATE POLICY "Users see own redemptions" ON referral_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- 4) Reserva atomica: valida saldo y crea fila pending en una sola TX.
-- Devuelve { redemption_id, new_balance } o error.
CREATE OR REPLACE FUNCTION reserve_referral_redemption(
  p_user_id UUID,
  p_amount_euros INTEGER
)
RETURNS TABLE(redemption_id UUID, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_customer_id TEXT;
  v_redemption_id UUID;
BEGIN
  IF p_amount_euros IS NULL OR p_amount_euros <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  -- Lock pesimista sobre la fila profile.
  SELECT referral_balance, stripe_customer_id
    INTO v_current_balance, v_customer_id
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_current_balance IS NULL OR v_current_balance < p_amount_euros THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  IF v_customer_id IS NULL OR v_customer_id = '' THEN
    RAISE EXCEPTION 'no_stripe_customer';
  END IF;

  -- Descuenta el saldo y crea el registro pending.
  UPDATE profiles
    SET referral_balance = v_current_balance - p_amount_euros
    WHERE id = p_user_id;

  INSERT INTO referral_redemptions (user_id, amount_euros, status, stripe_customer_id)
    VALUES (p_user_id, p_amount_euros, 'pending', v_customer_id)
    RETURNING id INTO v_redemption_id;

  RETURN QUERY SELECT v_redemption_id, (v_current_balance - p_amount_euros);
END;
$$;

REVOKE ALL ON FUNCTION reserve_referral_redemption(UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION reserve_referral_redemption(UUID, INTEGER) FROM anon, authenticated;

-- 5) Revierte un canje fallido (Stripe rechazo) devolviendo el saldo.
CREATE OR REPLACE FUNCTION revert_referral_redemption(
  p_redemption_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_amount INTEGER;
  v_status TEXT;
BEGIN
  SELECT user_id, amount_euros, status
    INTO v_user_id, v_amount, v_status
    FROM referral_redemptions
    WHERE id = p_redemption_id
    FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'redemption_not_found'; END IF;
  IF v_status != 'pending' THEN RAISE EXCEPTION 'invalid_status'; END IF;

  UPDATE profiles
    SET referral_balance = COALESCE(referral_balance, 0) + v_amount
    WHERE id = v_user_id;

  UPDATE referral_redemptions
    SET status = 'failed', failure_reason = LEFT(p_reason, 500)
    WHERE id = p_redemption_id;
END;
$$;

REVOKE ALL ON FUNCTION revert_referral_redemption(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION revert_referral_redemption(UUID, TEXT) FROM anon, authenticated;

-- 6) Marca aplicado cuando Stripe confirma el balance transaction.
CREATE OR REPLACE FUNCTION mark_referral_redemption_applied(
  p_redemption_id UUID,
  p_stripe_tx_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE referral_redemptions
    SET status = 'applied',
        applied_at = NOW(),
        stripe_balance_tx_id = p_stripe_tx_id
    WHERE id = p_redemption_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'redemption_not_pending';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION mark_referral_redemption_applied(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION mark_referral_redemption_applied(UUID, TEXT) FROM anon, authenticated;

SELECT 'referral_redemptions installed' AS status;
