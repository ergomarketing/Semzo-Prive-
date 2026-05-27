-- ============================================================
-- FIX: consume_gift_card_atomic - corregir mismatch de unidades
-- ============================================================
-- gift_cards.amount esta en CENTAVOS (ej: 18000 = 180 EUR).
-- La funcion antigua restaba directamente p_amount sin asumir unidad,
-- lo que causaba que callers en EUROS dejaran saldos absurdos.
--
-- Esta version es EXPLICITA: p_amount_cents siempre en CENTS.
-- ============================================================

CREATE OR REPLACE FUNCTION consume_gift_card_atomic(
  p_gift_card_id   UUID,
  p_amount         INTEGER,  -- AHORA EN CENTAVOS (entero)
  p_user_id        UUID    DEFAULT NULL,
  p_reference_id   TEXT    DEFAULT NULL,
  p_reference_type TEXT    DEFAULT 'bag_pass'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance_before INTEGER;
  v_new_balance    INTEGER;
  v_gc_status      TEXT;
BEGIN
  -- Lock exclusivo para evitar race conditions
  SELECT amount, status
    INTO v_balance_before, v_gc_status
    FROM gift_cards
   WHERE id = p_gift_card_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, 'Gift card no encontrada'::TEXT;
    RETURN;
  END IF;

  IF v_gc_status NOT IN ('active', 'partial') THEN
    RETURN QUERY SELECT FALSE, v_balance_before,
      ('Gift card en estado: ' || v_gc_status)::TEXT;
    RETURN;
  END IF;

  -- Verificar saldo suficiente (ambos en cents)
  IF v_balance_before < p_amount THEN
    RETURN QUERY SELECT FALSE, v_balance_before,
      ('Saldo insuficiente: disponible ' || v_balance_before || ' cents, solicitado ' || p_amount || ' cents')::TEXT;
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

  -- Descontar saldo (en cents) y actualizar estado
  UPDATE gift_cards
     SET amount     = amount - p_amount,
         status     = CASE
                        WHEN (amount - p_amount) <= 0 THEN 'used'
                        WHEN (amount - p_amount) < original_amount THEN 'partial'
                        ELSE 'active'
                      END,
         updated_at = NOW()
   WHERE id = p_gift_card_id
  RETURNING amount INTO v_new_balance;

  -- Registrar transaccion (amount en cents)
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
