-- Script de verificación y creación de tablas faltantes

-- 1. Verificar y crear tabla bag_passes si no existe
CREATE TABLE IF NOT EXISTS bag_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pass_tier TEXT NOT NULL CHECK (pass_tier IN ('lessentiel', 'signature', 'prive')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  price DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_for_reservation_id UUID REFERENCES reservations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para bag_passes
CREATE INDEX IF NOT EXISTS idx_bag_passes_user_id ON bag_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_bag_passes_status ON bag_passes(status);
CREATE INDEX IF NOT EXISTS idx_bag_passes_user_status ON bag_passes(user_id, status);

-- RLS para bag_passes
ALTER TABLE bag_passes ENABLE ROW LEVEL SECURITY;

-- Corregido de "IF NOT EXISTS" a "IF EXISTS" para DROP POLICY
DROP POLICY IF EXISTS "Users can view own passes" ON bag_passes;
CREATE POLICY "Users can view own passes"
ON bag_passes FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own passes" ON bag_passes;
CREATE POLICY "Users can insert own passes"
ON bag_passes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own passes" ON bag_passes;
CREATE POLICY "Users can update own passes"
ON bag_passes FOR UPDATE
USING (auth.uid() = user_id);

-- 2. Verificar y crear tabla user_memberships si no existe
CREATE TABLE IF NOT EXISTS user_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL DEFAULT 'free' CHECK (membership_type IN ('free', 'petite', 'essentiel', 'signature', 'prive')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'suspended')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  can_make_reservations BOOLEAN NOT NULL DEFAULT true,
  stripe_subscription_id TEXT,
  stripe_payment_method_id TEXT,
  payment_method_verified BOOLEAN DEFAULT false,
  failed_payment_count INTEGER DEFAULT 0,
  dunning_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para user_memberships
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_user_memberships_type ON user_memberships(membership_type);

-- RLS para user_memberships
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Corregido de "IF NOT EXISTS" a "IF EXISTS" para DROP POLICY
DROP POLICY IF EXISTS "Users can view own membership" ON user_memberships;
CREATE POLICY "Users can view own membership"
ON user_memberships FOR SELECT
USING (auth.uid() = user_id);

-- 3. Función auxiliar para contar pases disponibles
CREATE OR REPLACE FUNCTION count_available_passes(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM bag_passes
    WHERE user_id = p_user_id
      AND status = 'available'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para actualizar updated_at en bag_passes
CREATE OR REPLACE FUNCTION update_bag_passes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bag_passes_timestamp ON bag_passes;
CREATE TRIGGER update_bag_passes_timestamp
BEFORE UPDATE ON bag_passes
FOR EACH ROW
EXECUTE FUNCTION update_bag_passes_updated_at();

-- 5. Verificar tabla audit_log (singular, no plural)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- 6. Agregar columna available_passes_count a profiles si no existe
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS available_passes_count INTEGER DEFAULT 0;

-- Actualizar contador de pases para usuarios existentes
UPDATE profiles p
SET available_passes_count = (
  SELECT COUNT(*)
  FROM bag_passes bp
  WHERE bp.user_id = p.id
    AND bp.status = 'available'
    AND (bp.expires_at IS NULL OR bp.expires_at > NOW())
)
WHERE EXISTS (SELECT 1 FROM bag_passes WHERE user_id = p.id);
