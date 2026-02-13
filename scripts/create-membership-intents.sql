-- Create membership_intents table
CREATE TABLE IF NOT EXISTS membership_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL CHECK (membership_type IN ('petite', 'essentiel', 'signature', 'prive')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly')),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'paid_pending_verification', 'active', 'failed', 'cancelled')),
  
  -- Stripe references
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_verification_session_id TEXT,
  
  -- Discounts applied
  coupon_code TEXT,
  coupon_discount DECIMAL(10,2) DEFAULT 0,
  gift_card_code TEXT,
  gift_card_amount_used DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_membership_intents_user_id ON membership_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_intents_status ON membership_intents(status);
CREATE INDEX IF NOT EXISTS idx_membership_intents_stripe_payment ON membership_intents(stripe_payment_intent_id);

-- RLS policies
ALTER TABLE membership_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own membership intents"
  ON membership_intents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all membership intents"
  ON membership_intents FOR ALL
  USING (auth.role() = 'service_role');
