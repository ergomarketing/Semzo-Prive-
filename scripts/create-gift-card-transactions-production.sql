-- TABLA DE TRANSACCIONES DE GIFT CARDS
-- Idempotencia real con constraint único por operación

CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('bag_pass', 'membership', 'reservation')),
  reference_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CONSTRAINT ÚNICO: Una gift card solo puede usarse una vez por operación
  CONSTRAINT unique_gift_card_operation UNIQUE (gift_card_id, reference_id)
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_gc_transactions_gift_card ON gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gc_transactions_user ON gift_card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gc_transactions_reference ON gift_card_transactions(reference_type, reference_id);

-- RLS
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON gift_card_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert" ON gift_card_transactions
  FOR INSERT WITH CHECK (true);
