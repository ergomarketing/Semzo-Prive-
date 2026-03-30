-- Add api_credentials column to logistics_settings table
-- This column stores carrier API credentials as JSONB

-- Add the column if it doesn't exist
ALTER TABLE logistics_settings 
ADD COLUMN IF NOT EXISTS api_credentials JSONB;

-- Add unique constraint on carrier_name for upsert operations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'logistics_settings_carrier_name_key'
  ) THEN
    ALTER TABLE logistics_settings 
    ADD CONSTRAINT logistics_settings_carrier_name_key UNIQUE (carrier_name);
  END IF;
END $$;

-- Update RLS policy to allow admin access
DROP POLICY IF EXISTS "Admin can manage logistics_settings" ON logistics_settings;

CREATE POLICY "Admin can manage logistics_settings" ON logistics_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Enable RLS
ALTER TABLE logistics_settings ENABLE ROW LEVEL SECURITY;
