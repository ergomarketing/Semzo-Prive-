-- Crear tabla para membresías pendientes de usuarios guest
CREATE TABLE IF NOT EXISTS pending_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  membership_type TEXT NOT NULL,
  payment_intent_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id)
);

-- Índice para búsqueda rápida por email
CREATE INDEX IF NOT EXISTS idx_pending_memberships_email ON pending_memberships(email);
CREATE INDEX IF NOT EXISTS idx_pending_memberships_payment_intent ON pending_memberships(payment_intent_id);

-- RLS policies
ALTER TABLE pending_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden ver pending_memberships" 
  ON pending_memberships FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
