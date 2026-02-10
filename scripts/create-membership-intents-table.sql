-- Create membership_intents table to track the complete membership lifecycle
CREATE TABLE IF NOT EXISTS membership_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Membership details
  membership_type TEXT NOT NULL CHECK (membership_type IN ('petite', 'lessentiel', 'signature', 'prive')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly')),
  
  -- Pricing
  amount_cents INTEGER NOT NULL,
  original_amount_cents INTEGER NOT NULL,
  
  -- Discounts applied
  coupon_code TEXT,
  coupon_discount_cents INTEGER DEFAULT 0,
  gift_card_code TEXT,
  gift_card_applied_cents INTEGER DEFAULT 0,
  
  -- Status lifecycle: initiated → paid_pending_verification → active → canceled
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'paid_pending_verification', 'active', 'canceled', 'expired')),
  
  -- Stripe references
  stripe_payment_intent_id TEXT,
  stripe_setup_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_verification_session_id TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'), -- Intent expires if not completed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_membership_intents_user_id ON membership_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_intents_status ON membership_intents(status);
CREATE INDEX IF NOT EXISTS idx_membership_intents_stripe_payment_intent ON membership_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_membership_intents_expires_at ON membership_intents(expires_at);

-- RLS Policies
ALTER TABLE membership_intents ENABLE ROW LEVEL SECURITY;

-- Users can only view their own intents
CREATE POLICY "Users can view own membership intents"
  ON membership_intents FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert/update
CREATE POLICY "System can manage membership intents"
  ON membership_intents FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_membership_intents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_membership_intents_timestamp
  BEFORE UPDATE ON membership_intents
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_intents_updated_at();

-- Cleanup expired intents (run this as a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_membership_intents()
RETURNS void AS $$
BEGIN
  UPDATE membership_intents
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'initiated'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
