-- Eliminar tabla si existe
DROP TABLE IF EXISTS public.users CASCADE;

-- Crear tabla users
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  membership_status VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (true);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_membership_status ON public.users(membership_status);

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
