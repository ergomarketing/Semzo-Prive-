-- Add auth_method column to profiles table
-- This is the ONLY source of truth for determining if Identity is required

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS auth_method TEXT CHECK (auth_method IN ('sms', 'email'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_auth_method ON profiles(auth_method);

-- Comment
COMMENT ON COLUMN profiles.auth_method IS 'SMS = compra inmediata con Identity obligatoria | Email = registro libre sin Identity';
