-- 1. CREAR/ACTUALIZAR TABLA users
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  first_name       TEXT,
  last_name        TEXT,
  phone            TEXT,
  membership_status TEXT DEFAULT 'free',
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Función para updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. CONFIGURAR RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "allow_insert_during_signup" ON public.users;
DROP POLICY IF EXISTS "allow_select_own_profile" ON public.users;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.users;

-- Política para inserción durante registro
CREATE POLICY "allow_insert_during_signup"
  ON public.users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para ver propio perfil
CREATE POLICY "allow_select_own_profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para actualizar propio perfil
CREATE POLICY "allow_update_own_profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
