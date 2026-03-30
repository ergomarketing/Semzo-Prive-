-- Add return tracking columns to shipments table
-- This allows storing both outbound and return shipping labels

ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS return_tracking_number TEXT;

ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS return_correos_response JSONB;

ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS return_label_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN shipments.return_tracking_number IS 'Tracking number for prepaid return label sent with the package';
COMMENT ON COLUMN shipments.return_correos_response IS 'Full API response from Correos for return shipment';
COMMENT ON COLUMN shipments.return_label_url IS 'URL to download the return label PDF';
