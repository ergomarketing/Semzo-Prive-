-- Crear tabla para registro de checks antifraude
CREATE TABLE IF NOT EXISTS fraud_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_intent_id TEXT,
  check_type TEXT NOT NULL, -- 'duplicate_membership', 'radar_score', 'geo_location', 'avs_check', 'cvc_check'
  check_status TEXT NOT NULL, -- 'passed', 'failed', 'warning'
  risk_score INTEGER, -- 0-100
  details JSONB, -- Detalles específicos del check
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_checks_user ON fraud_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_payment ON fraud_checks(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_status ON fraud_checks(check_status);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_created ON fraud_checks(created_at DESC);

-- RLS
ALTER TABLE fraud_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF NOT EXISTS "Service role full access fraud_checks" ON fraud_checks;
CREATE POLICY "Service role full access fraud_checks" ON fraud_checks
  FOR ALL USING (true);
