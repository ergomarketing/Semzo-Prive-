-- Add shipping information fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100) DEFAULT 'España';

-- Add index for faster queries on shipping city and country
CREATE INDEX IF NOT EXISTS idx_profiles_shipping_city ON profiles(shipping_city);
CREATE INDEX IF NOT EXISTS idx_profiles_shipping_country ON profiles(shipping_country);

-- Add updated_at trigger for shipping fields
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at_trigger') THEN
        CREATE TRIGGER update_profiles_updated_at_trigger
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_profiles_updated_at();
    END IF;
END
$$;
