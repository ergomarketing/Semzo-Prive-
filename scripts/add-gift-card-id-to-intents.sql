-- Add gift_card_id column to membership_intents for unified gift card tracking
-- This allows the confirmation endpoint to use the persisted ID instead of searching by code

ALTER TABLE membership_intents 
ADD COLUMN IF NOT EXISTS gift_card_id UUID REFERENCES gift_cards(id);

-- Add gift_card_consumed_at for idempotency
ALTER TABLE membership_intents 
ADD COLUMN IF NOT EXISTS gift_card_consumed_at TIMESTAMPTZ;

-- Add payment_method column
ALTER TABLE membership_intents 
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_membership_intents_gift_card_id 
ON membership_intents(gift_card_id) WHERE gift_card_id IS NOT NULL;

-- Create unique constraint to prevent duplicate processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_intents_gift_card_consumed 
ON membership_intents(gift_card_id, gift_card_consumed_at) 
WHERE gift_card_consumed_at IS NOT NULL;
