-- Fix consume_gift_card_atomic to use correct column name (amount, not balance)
-- gift_cards.amount stores the balance in EUROS (e.g., 30.06 = 30.06€)

CREATE OR REPLACE FUNCTION consume_gift_card_atomic(
  p_gift_card_id UUID,
  p_amount DECIMAL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Use "amount" column (not "balance")
  UPDATE gift_cards
  SET amount = amount - p_amount,
      updated_at = NOW()
  WHERE id = p_gift_card_id
    AND amount >= p_amount
  RETURNING amount INTO v_new_balance;
  
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_new_balance;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::DECIMAL;
  END IF;
END;
$$;
