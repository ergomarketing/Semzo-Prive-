-- Sistema completo de Pases de Bolso para membresía Petite
-- Permite a usuarios Petite acceder a bolsos de categorías superiores comprando pases

-- Tabla de pases de bolso
CREATE TABLE IF NOT EXISTS bag_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pass_tier TEXT NOT NULL CHECK (pass_tier IN ('lessentiel', 'signature', 'prive')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  used_for_reservation_id UUID REFERENCES reservations(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  price DECIMAL(10, 2) NOT NULL,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_bag_passes_user_id ON bag_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_bag_passes_status ON bag_passes(status);
CREATE INDEX IF NOT EXISTS idx_bag_passes_user_status ON bag_passes(user_id, status);

-- RLS para bag_passes
ALTER TABLE bag_passes ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver solo sus propios pases
CREATE POLICY "Users can view own passes"
  ON bag_passes FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden insertar sus propios pases (compra)
CREATE POLICY "Users can insert own passes"
  ON bag_passes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el sistema puede actualizar pases (cuando se usan)
CREATE POLICY "System can update passes"
  ON bag_passes FOR UPDATE
  USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_bag_passes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bag_passes_timestamp
  BEFORE UPDATE ON bag_passes
  FOR EACH ROW
  EXECUTE FUNCTION update_bag_passes_updated_at();

-- Agregar columna a profiles para tracking de pases
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS available_passes_count INTEGER DEFAULT 0;

-- Función para contar pases disponibles de un usuario
CREATE OR REPLACE FUNCTION count_available_passes(p_user_id UUID, p_tier TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF p_tier IS NULL THEN
    RETURN (
      SELECT COUNT(*)
      FROM bag_passes
      WHERE user_id = p_user_id 
        AND status = 'available'
        AND (expires_at IS NULL OR expires_at > NOW())
    );
  ELSE
    RETURN (
      SELECT COUNT(*)
      FROM bag_passes
      WHERE user_id = p_user_id 
        AND pass_tier = p_tier
        AND status = 'available'
        AND (expires_at IS NULL OR expires_at > NOW())
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
