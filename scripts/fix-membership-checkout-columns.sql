-- Add stripe_checkout_session_id to membership_intents if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'membership_intents'
    AND column_name = 'stripe_checkout_session_id'
  ) THEN
    ALTER TABLE membership_intents ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;
END $$;

-- Ensure identity_verifications has the needed columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'identity_verifications'
    AND column_name = 'stripe_verification_id'
  ) THEN
    ALTER TABLE identity_verifications ADD COLUMN stripe_verification_id TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'identity_verifications'
    AND column_name = 'intent_id'
  ) THEN
    ALTER TABLE identity_verifications ADD COLUMN intent_id UUID REFERENCES membership_intents(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'identity_verifications'
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE identity_verifications ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'identity_verifications'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE identity_verifications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create index on stripe_verification_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_identity_verifications_stripe_id
  ON identity_verifications(stripe_verification_id);

-- Create index on membership_intents stripe_checkout_session_id
CREATE INDEX IF NOT EXISTS idx_membership_intents_checkout_session
  ON membership_intents(stripe_checkout_session_id);
