-- Add gift_card_consumed_at column to membership_intents for idempotency
ALTER TABLE membership_intents 
ADD COLUMN IF NOT EXISTS gift_card_consumed_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_membership_intents_gift_card_consumed 
ON membership_intents(user_id, payment_method, gift_card_consumed_at) 
WHERE payment_method = 'gift_card';

-- Create atomic gift card consumption function
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
  UPDATE gift_cards
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_gift_card_id
    AND balance >= p_amount
  RETURNING balance INTO v_new_balance;
  
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, v_new_balance;
  ELSE
    RETURN QUERY SELECT FALSE, NULL::DECIMAL;
  END IF;
END;
$$;
