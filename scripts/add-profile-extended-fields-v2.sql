-- Agregar columnas extendidas a profiles para verificación antifraude
-- Ejecutar este script para habilitar el formulario extendido

-- Agregar columnas si no existen
DO $$ 
BEGIN
    -- full_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
    
    -- phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;
    
    -- document_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'document_type') THEN
        ALTER TABLE profiles ADD COLUMN document_type TEXT DEFAULT 'dni';
    END IF;
    
    -- document_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'document_number') THEN
        ALTER TABLE profiles ADD COLUMN document_number TEXT;
    END IF;
    
    -- address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE profiles ADD COLUMN address TEXT;
    END IF;
    
    -- city
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
        ALTER TABLE profiles ADD COLUMN city TEXT;
    END IF;
    
    -- postal_code
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'postal_code') THEN
        ALTER TABLE profiles ADD COLUMN postal_code TEXT;
    END IF;
    
    -- country
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
        ALTER TABLE profiles ADD COLUMN country TEXT DEFAULT 'España';
    END IF;
    
    -- identity_verified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'identity_verified') THEN
        ALTER TABLE profiles ADD COLUMN identity_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- identity_verification_id (para Stripe Identity)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'identity_verification_id') THEN
        ALTER TABLE profiles ADD COLUMN identity_verification_id TEXT;
    END IF;
END $$;

-- Crear tabla identity_verifications si no existe
CREATE TABLE IF NOT EXISTS identity_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_session_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    document_type TEXT,
    document_country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_identity_verifications_user_id ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_stripe_session ON identity_verifications(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_verified ON profiles(identity_verified);
