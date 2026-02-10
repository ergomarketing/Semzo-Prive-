-- Tabla para trazabilidad e idempotencia de consumo de gift cards
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('bag_pass', 'membership', 'reservation')),
  reference_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para idempotencia: una gift card solo puede tener una transacción por reference_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_gift_card_transactions_idempotency 
ON gift_card_transactions(gift_card_id, reference_id);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_gift_card_id 
ON gift_card_transactions(gift_card_id);

CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_reference 
ON gift_card_transactions(reference_type, reference_id);

-- RLS
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver transacciones
CREATE POLICY "Admins can view gift card transactions" ON gift_card_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- El sistema puede insertar (service role)
CREATE POLICY "Service can insert gift card transactions" ON gift_card_transactions
  FOR INSERT WITH CHECK (true);
