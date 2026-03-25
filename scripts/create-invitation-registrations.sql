-- Crear tabla para registros de invitaciones
CREATE TABLE IF NOT EXISTS invitation_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  codigo_descuento TEXT DEFAULT 'PRIVE50',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear indice para busquedas por email
CREATE INDEX IF NOT EXISTS idx_invitation_registrations_email ON invitation_registrations(email);

-- Crear indice para busquedas por fecha
CREATE INDEX IF NOT EXISTS idx_invitation_registrations_created_at ON invitation_registrations(created_at DESC);

-- Habilitar RLS
ALTER TABLE invitation_registrations ENABLE ROW LEVEL SECURITY;

-- Politica para permitir inserciones publicas (sin auth requerida)
CREATE POLICY "Allow public inserts" ON invitation_registrations
  FOR INSERT
  WITH CHECK (true);

-- Politica para que solo admins puedan leer
CREATE POLICY "Allow admin read" ON invitation_registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
