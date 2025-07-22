-- Eliminar tabla existente si hay problemas
DROP TABLE IF EXISTS public.users;

-- Crear tabla users desde cero
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    membership_status TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción con service_role
CREATE POLICY "Allow service_role to insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Política para permitir lectura con service_role
CREATE POLICY "Allow service_role to read users" ON public.users
    FOR SELECT USING (true);

-- Política para permitir actualización con service_role
CREATE POLICY "Allow service_role to update users" ON public.users
    FOR UPDATE USING (true);

-- Política para permitir eliminación con service_role
CREATE POLICY "Allow service_role to delete users" ON public.users
    FOR DELETE USING (true);

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
