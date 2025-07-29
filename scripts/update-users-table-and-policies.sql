-- Eliminar tabla existente si existe
DROP TABLE IF EXISTS public.users CASCADE;

-- Crear tabla users sin RLS para evitar problemas
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  membership_status TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desactivar RLS completamente
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Dar permisos completos a anon y authenticated
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_membership ON public.users(membership_status);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
