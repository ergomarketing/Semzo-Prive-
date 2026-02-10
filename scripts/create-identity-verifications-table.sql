-- Crear tabla para guardar verificaciones de identidad
CREATE TABLE IF NOT EXISTS identity_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_verification_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  membership_type TEXT,
  last_error TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas de verificación a profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Índices
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_status ON identity_verifications(status);

-- RLS
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verifications" ON identity_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage verifications" ON identity_verifications
  FOR ALL USING (true);
