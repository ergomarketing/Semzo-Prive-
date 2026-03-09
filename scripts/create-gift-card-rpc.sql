-- RPC atómica para consumir gift card
-- amount en DB está en CÉNTIMOS (ej: 20000 = 200€)
-- p_amount también debe pasarse en CÉNTIMOS
-- Postgres garantiza atomicidad: no hay race condition, no hay saldo negativo
CREATE OR REPLACE FUNCTION public.atomic_gift_card_consume(
  p_gift_card_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows_updated INTEGER;
BEGIN
  UPDATE public.gift_cards
  SET
    amount = GREATEST(0, amount - p_amount),
    status = CASE WHEN (amount - p_amount) <= 0 THEN 'used' ELSE 'active' END,
    updated_at = NOW()
  WHERE id = p_gift_card_id
    AND status = 'active'
    AND amount >= p_amount;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  RETURN v_rows_updated > 0;
END;
$$;
