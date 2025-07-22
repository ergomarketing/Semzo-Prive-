-- 1.  TABLA ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Si la tabla ya existe solo la dejamos como está
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY,                 -- mismo id que auth.users
  email            TEXT UNIQUE NOT NULL,
  first_name       TEXT,
  last_name        TEXT,
  phone            TEXT,
  membership_status TEXT   DEFAULT 'free',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2.  RLS ---------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Limpia políticas antiguas
DROP POLICY IF EXISTS "allow anything"            ON public.users;
DROP POLICY IF EXISTS "insert_during_signup"      ON public.users;
DROP POLICY IF EXISTS "users_select_own_profile"  ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile"  ON public.users;

-- a)  Inserción DURANTE el alta  (rol anon ó authenticated)
CREATE POLICY insert_during_signup
  ON public.users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- b)  Los usuarios autenticados pueden ver su propio perfil
CREATE POLICY users_select_own_profile
  ON public.users
  FOR SELECT
  TO authenticated
  USING ( auth.uid() = id );

-- c)  Pueden actualizar su propio perfil
CREATE POLICY users_update_own_profile
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ( auth.uid() = id );

-- d)  El service_role puede hacer lo que quiera (política implícita)
