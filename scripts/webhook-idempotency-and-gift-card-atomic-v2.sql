-- ============================================================
-- 1. TABLA DE EVENTOS STRIPE PROCESADOS (idempotencia webhook)
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_processed_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_processed_at
  ON stripe_processed_events(processed_at);

-- ============================================================
-- 2. consume_gift_card_atomic v2
-- ============================================================
-- CAMBIOS:
--   a) Verifica saldo suficiente (balance >= amount)
--   b) Idempotencia via gift_card_transactions UNIQUE(gift_card_id, reference_id)
--   c) reference_id es TEXT (acepta Stripe session IDs como cs_xxx, sub_xxx, etc.)
--   d) Devuelve mensaje descriptivo para debugging

-- Primero aseguramos que reference_id en gift_card_transactions sea TEXT
-- (puede ser UUID o stripe ID según el contexto)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name = 'gift_card_transactions'
       AND column_name = 'reference_id'
       AND data_type = 'uuid'
  ) THEN
    ALTER TABLE gift_card_transactions ALTER COLUMN reference_id TYPE TEXT USING reference_id::TEXT;
  END IF;
END $$;

-- Recrear constraint único si cambió el tipo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE constraint_name = 'unique_gift_card_operation'
  ) THEN
    ALTER TABLE gift_card_transactions
      ADD CONSTRAINT unique_gift_card_operation UNIQUE (gift_card_id, reference_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION consume_gift_card_atomic(
  p_gift_card_id   UUID,
  p_amount         DECIMAL,
  p_user_id        UUID    DEFAULT NULL,
  p_reference_id   TEXT    DEFAULT NULL,
  p_reference_type TEXT    DEFAULT 'bag_pass'
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance_before DECIMAL;
  v_new_balance    DECIMAL;
  v_gc_status      TEXT;
BEGIN
  -- Lock exclusivo para evitar race conditions
  SELECT amount, status
    INTO v_balance_before, v_gc_status
    FROM gift_cards
   WHERE id = p_gift_card_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::DECIMAL, 'Gift card no encontrada'::TEXT;
    RETURN;
  END IF;

  IF v_gc_status NOT IN ('active', 'partial') THEN
    RETURN QUERY SELECT FALSE, v_balance_before,
      ('Gift card en estado: ' || v_gc_status)::TEXT;
    RETURN;
  END IF;

  -- Verificar saldo suficiente
  IF v_balance_before < p_amount THEN
    RETURN QUERY SELECT FALSE, v_balance_before,
      ('Saldo insuficiente: disponible ' || v_balance_before || ', solicitado ' || p_amount)::TEXT;
    RETURN;
  END IF;

  -- Idempotencia: operacion ya procesada
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM gift_card_transactions
       WHERE gift_card_id = p_gift_card_id
         AND reference_id = p_reference_id
    ) THEN
      RETURN QUERY SELECT FALSE, v_balance_before, 'Operacion ya procesada (idempotente)'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Descontar saldo y actualizar estado
  UPDATE gift_cards
     SET amount     = amount - p_amount,
         status     = CASE WHEN (amount - p_amount) <= 0 THEN 'used' ELSE 'active' END,
         updated_at = NOW()
   WHERE id = p_gift_card_id
  RETURNING amount INTO v_new_balance;

  -- Registrar transaccion
  IF p_reference_id IS NOT NULL AND p_user_id IS NOT NULL THEN
    INSERT INTO gift_card_transactions (
      gift_card_id, user_id, reference_type, reference_id,
      amount, balance_before, balance_after
    ) VALUES (
      p_gift_card_id, p_user_id, p_reference_type, p_reference_id,
      p_amount, v_balance_before, v_new_balance
    )
    ON CONFLICT (gift_card_id, reference_id) DO NOTHING;
  END IF;

  RETURN QUERY SELECT TRUE, v_new_balance, 'OK'::TEXT;
END;
$$;
