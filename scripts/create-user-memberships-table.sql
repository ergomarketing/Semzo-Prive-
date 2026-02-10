-- Crear tabla user_memberships para gestión de membresías
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  can_make_reservations BOOLEAN NOT NULL DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  payment_method_verified BOOLEAN DEFAULT false,
  failed_payment_count INTEGER DEFAULT 0,
  dunning_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id 
ON user_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_user_memberships_status 
ON user_memberships(status);

CREATE INDEX IF NOT EXISTS idx_user_memberships_type 
ON user_memberships(membership_type);

CREATE INDEX IF NOT EXISTS idx_user_memberships_end_date 
ON user_memberships(end_date);

-- RLS Policies
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership"
  ON user_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON user_memberships FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_memberships_updated_at
  BEFORE UPDATE ON user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memberships_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE user_memberships IS 'Tabla principal de gestión de membresías de usuarios';
COMMENT ON COLUMN user_memberships.membership_type IS 'Tipo de membresía: free, essentiel, signature, prive';
COMMENT ON COLUMN user_memberships.status IS 'Estado: active, suspended, cancelled, expired';
COMMENT ON COLUMN user_memberships.can_make_reservations IS 'Permiso para hacer reservas de bolsos';
COMMENT ON COLUMN user_memberships.stripe_payment_method_id IS 'ID del método de pago guardado en Stripe';
COMMENT ON COLUMN user_memberships.payment_method_verified IS 'Si el método de pago fue verificado con Setup Intent';
COMMENT ON COLUMN user_memberships.failed_payment_count IS 'Contador de intentos de cobro fallidos consecutivos';
COMMENT ON COLUMN user_memberships.dunning_status IS 'Estado de recuperación: grace_period, warning_sent, suspended';
