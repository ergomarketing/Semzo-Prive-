DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'payment_method') THEN
    ALTER TABLE subscriptions ADD COLUMN payment_method text DEFAULT 'stripe';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'gift_card_code') THEN
    ALTER TABLE subscriptions ADD COLUMN gift_card_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'amount_paid') THEN
    ALTER TABLE subscriptions ADD COLUMN amount_paid numeric;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON profiles(membership_type);
