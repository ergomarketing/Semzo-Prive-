-- Add payment method tracking to user_memberships
ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method_last4 VARCHAR(4),
ADD COLUMN IF NOT EXISTS payment_method_brand VARCHAR(20),
ADD COLUMN IF NOT EXISTS last_payment_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dunning_status VARCHAR(20);

-- Create index for payment tracking
CREATE INDEX IF NOT EXISTS idx_user_memberships_payment_status 
ON user_memberships(payment_method_verified, failed_payment_count);

COMMENT ON COLUMN user_memberships.stripe_payment_method_id IS 'Stripe PaymentMethod ID guardado para cobros recurrentes';
COMMENT ON COLUMN user_memberships.payment_method_verified IS 'Si el método de pago fue verificado vía Setup Intent';
COMMENT ON COLUMN user_memberships.failed_payment_count IS 'Contador de intentos de pago fallidos consecutivos';
COMMENT ON COLUMN user_memberships.dunning_status IS 'Estado del proceso de recuperación: grace_period, warning_sent, suspended';
