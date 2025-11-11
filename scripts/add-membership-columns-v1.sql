-- Add membership-related columns to profiles table if they don't exist
-- This fixes the error: "column profiles.membership_type does not exist"

-- Add membership_type column (replaces member_type for consistency)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'free';

-- Add membership_status column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'inactive';

-- Add subscription_end_date column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Add subscription_id column for Stripe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Create index for faster membership queries
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_status ON profiles(membership_status);

-- Update existing rows to have proper values
UPDATE profiles
SET 
  membership_type = COALESCE(membership_type, 'free'),
  membership_status = COALESCE(membership_status, 'inactive')
WHERE membership_type IS NULL OR membership_status IS NULL;

-- Show confirmation
SELECT 
  'Membership columns added successfully' as status,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN membership_type IS NOT NULL THEN 1 END) as profiles_with_type,
  COUNT(CASE WHEN membership_status IS NOT NULL THEN 1 END) as profiles_with_status
FROM profiles;
