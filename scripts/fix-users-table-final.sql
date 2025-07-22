-- Eliminar tabla existente si hay problemas
DROP TABLE IF EXISTS public.users CASCADE;

-- Crear tabla users desde cero
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    membership_status TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción desde service_role
CREATE POLICY "Allow service_role to insert users" ON public.users
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Política para permitir lectura desde service_role
CREATE POLICY "Allow service_role to read users" ON public.users
    FOR SELECT TO service_role
    USING (true);

-- Política para permitir actualización desde service_role
CREATE POLICY "Allow service_role to update users" ON public.users
    FOR UPDATE TO service_role
    USING (true);

-- Política para que usuarios autenticados puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Política para que usuarios autenticados puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- Crear índices para mejor rendimiento
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
