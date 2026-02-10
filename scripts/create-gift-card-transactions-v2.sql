-- Tabla para registrar cada transacción de gift card con idempotencia
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gift_card_id, reference_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_gc_transactions_gift_card ON gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gc_transactions_user ON gift_card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_gc_transactions_reference ON gift_card_transactions(reference_type, reference_id);
