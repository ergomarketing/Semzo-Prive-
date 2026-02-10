-- EJECUTA ESTO MANUALMENTE EN SUPABASE SQL EDITOR

-- 1. Crear tabla membership_intents
CREATE TABLE IF NOT EXISTS membership_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  membership_type TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  
  amount_cents INTEGER NOT NULL,
  original_amount_cents INTEGER NOT NULL,
  
  coupon_code TEXT,
  coupon_discount_cents INTEGER DEFAULT 0,
  gift_card_code TEXT,
  gift_card_applied_cents INTEGER DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'initiated',
  
  stripe_payment_intent_id TEXT,
  stripe_setup_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_verification_session_id TEXT,
  
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_membership_intents_user_id ON membership_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_intents_status ON membership_intents(status);
CREATE INDEX IF NOT EXISTS idx_membership_intents_stripe_payment_intent ON membership_intents(stripe_payment_intent_id);

-- 3. RLS
ALTER TABLE membership_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own membership intents" ON membership_intents;
CREATE POLICY "Users can view own membership intents"
  ON membership_intents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all intents" ON membership_intents;
CREATE POLICY "Service role can manage all intents"
  ON membership_intents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
