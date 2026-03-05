-- ============================================================
-- 1. TABLA DE EVENTOS STRIPE PROCESADOS (idempotencia webhook)
-- ============================================================
-- Evita que Stripe reintente un evento y se procese dos veces
-- (doble consumo de gift card, doble activación de membresía, etc.)

CREATE TABLE IF NOT EXISTS stripe_processed_events (
  event_id    TEXT PRIMARY KEY,           -- Stripe event ID: evt_xxx
  event_type  TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-limpieza: borrar eventos con más de 30 días
-- (Stripe solo reintenta durante 3 días)
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at
  ON stripe_processed_events(processed_at);

-- ============================================================
-- 2. consume_gift_card_atomic v2
-- ============================================================
-- Cambios respecto a v1:
--   a) Verifica balance suficiente ANTES de actualizar (ya lo hacía con AND amount >= p_amount)
--   b) Inserta en gift_card_transactions con UNIQUE(gift_card_id, reference_id)
--      — si ya existe esa combinación, la función devuelve success=false sin actualizar nada
--   c) Todo ocurre en una única transacción de base de datos (atómica)

CREATE OR REPLACE FUNCTION consume_gift_card_atomic(
  p_gift_card_id  UUID,
  p_amount        DECIMAL,
  p_user_id       UUID       DEFAULT NULL,
  p_reference_id  TEXT       DEFAULT NULL,   -- session.id de Stripe o intent_id
  p_reference_type TEXT      DEFAULT 'bag_pass'
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance_before  DECIMAL;
  v_new_balance     DECIMAL;
  v_gc_status       TEXT;
BEGIN
  -- Bloquear la fila para escritura exclusiva (evita race conditions)
  SELECT amount, status
    INTO v_balance_before, v_gc_status
    FROM gift_cards
   WHERE id = p_gift_card_id
     FOR UPDATE;

  -- Gift card no encontrada
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL, 'Gift card no encontrada'::TEXT;
    RETURN;
  END IF;

  -- Gift card inactiva o ya usada
  IF v_gc_status NOT IN ('active', 'partial') THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL, ('Gift card en estado: ' || v_gc_status)::TEXT;
    RETURN;
  END IF;

  -- Saldo insuficiente
  IF v_balance_before < p_amount THEN
    RETURN QUERY SELECT FALSE, v_balance_before,
      ('Saldo insuficiente: disponible ' || v_balance_before || '€, solicitado ' || p_amount || '€')::TEXT;
    RETURN;
  END IF;

  -- Idempotencia: si ya existe esta operación exacta, no la reprocesar
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM gift_card_transactions
       WHERE gift_card_id = p_gift_card_id
         AND reference_id = p_reference_id::UUID
    ) THEN
      RETURN QUERY SELECT FALSE, v_balance_before, 'Operación ya procesada (idempotente)'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Descontar saldo
  UPDATE gift_cards
     SET amount     = amount - p_amount,
         status     = CASE WHEN (amount - p_amount) <= 0 THEN 'used' ELSE 'active' END,
         updated_at = NOW()
   WHERE id = p_gift_card_id
  RETURNING amount INTO v_new_balance;

  -- Registrar transacción (UNIQUE constraint bloquea duplicados a nivel DB)
  IF p_reference_id IS NOT NULL AND p_user_id IS NOT NULL THEN
    INSERT INTO gift_card_transactions (
      gift_card_id,
      user_id,
      reference_type,
      reference_id,
      amount,
      balance_before,
      balance_after
    ) VALUES (
      p_gift_card_id,
      p_user_id,
      p_reference_type,
      p_reference_id::UUID,
      p_amount,
      v_balance_before,
      v_new_balance
    )
    ON CONFLICT (gift_card_id, reference_id) DO NOTHING;
  END IF;

  RETURN QUERY SELECT TRUE, v_new_balance, 'OK'::TEXT;
END;
$$;
