-- Eliminar triggers y funciones existentes si existen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();
DROP FUNCTION IF EXISTS public.handle_email_confirmation();

-- Eliminar tabla users si existe
DROP TABLE IF EXISTS public.users CASCADE;

-- Crear tabla users con estructura completa
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    membership_status TEXT DEFAULT 'free' CHECK (membership_status IN ('free', 'premium', 'vip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    email_confirmed BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    
    -- Constraint para validar email
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_membership_status ON public.users(membership_status);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_email_confirmed ON public.users(email_confirmed);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "System can insert users" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;

-- Políticas RLS
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Solo el sistema puede insertar usuarios (a través de triggers o service role)
CREATE POLICY "System can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Service role puede hacer todo
CREATE POLICY "Service role can do everything" ON public.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        phone,
        email_confirmed
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log el error pero no fallar el registro
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar confirmación de email
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar email_confirmed cuando se confirma el email
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE public.users 
        SET email_confirmed = TRUE 
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil cuando se registra un usuario
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para actualizar timestamp
CREATE TRIGGER on_user_updated
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Trigger para manejar confirmación de email
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- Conceder permisos necesarios
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comentarios para documentación
COMMENT ON TABLE public.users IS 'Tabla de perfiles de usuario extendida';
COMMENT ON COLUMN public.users.membership_status IS 'Estado de membresía: free, premium, vip';
COMMENT ON COLUMN public.users.email_confirmed IS 'Indica si el email ha sido confirmado';

-- Verificar que todo se creó correctamente
DO $$
BEGIN
    -- Verificar que la tabla existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabla users no fue creada correctamente';
    END IF;
    
    -- Verificar que los triggers existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
        RAISE EXCEPTION 'Trigger on_auth_user_created no fue creado correctamente';
    END IF;
    
    RAISE NOTICE 'Tabla users y triggers creados exitosamente';
END $$;
