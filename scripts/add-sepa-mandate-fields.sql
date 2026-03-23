-- Agregar campos para mandato SEPA en profiles
-- Ejecutar en Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sepa_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS sepa_mandate_accepted_at TIMESTAMPTZ;

-- Indice para buscar usuarios con mandato SEPA activo
CREATE INDEX IF NOT EXISTS idx_profiles_sepa_payment_method 
ON profiles(sepa_payment_method_id) 
WHERE sepa_payment_method_id IS NOT NULL;

COMMENT ON COLUMN profiles.sepa_payment_method_id IS 'Stripe PaymentMethod ID del mandato SEPA para cargos por incidencias';
COMMENT ON COLUMN profiles.sepa_mandate_accepted_at IS 'Fecha en que el usuario acepto el mandato SEPA';
