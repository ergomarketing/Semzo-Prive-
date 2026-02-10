-- Add profile_data JSONB column to membership_intents
-- This stores form data submitted during checkout to be persisted on activation

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'membership_intents' 
    AND column_name = 'profile_data'
  ) THEN
    ALTER TABLE membership_intents ADD COLUMN profile_data JSONB;
  END IF;
END $$;

-- Add index for faster JSONB queries if needed
CREATE INDEX IF NOT EXISTS idx_membership_intents_profile_data ON membership_intents USING GIN (profile_data);
