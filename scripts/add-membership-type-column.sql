-- Add membership_type column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'free';

-- Update existing active members to essentiel as default
UPDATE profiles
SET membership_type = 'essentiel'
WHERE membership_status = 'active' AND (membership_type IS NULL OR membership_type = 'free');
