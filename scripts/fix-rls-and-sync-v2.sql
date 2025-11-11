-- SCRIPT PARA HABILITAR RLS EN TABLAS Y SINCRONIZAR USUARIOS
-- Compatible con la estructura actual de la base de datos

-- ========================================
-- PARTE 1: HABILITAR RLS EN sms_queue Y notifications
-- ========================================

-- Habilitar RLS en sms_queue
ALTER TABLE IF EXISTS public.sms_queue ENABLE ROW LEVEL SECURITY;

-- Crear políticas para sms_queue
DROP POLICY IF EXISTS "sms_queue_select_own" ON public.sms_queue;
DROP POLICY IF EXISTS "sms_queue_insert_service" ON public.sms_queue;

-- Solo el usuario puede ver sus propios registros SMS
CREATE POLICY "sms_queue_select_own" ON public.sms_queue
    FOR SELECT
    USING (auth.uid()::text = user_id OR phone_number = (SELECT phone FROM auth.users WHERE id = auth.uid()));

-- El servicio puede insertar (se necesita para el sistema)
CREATE POLICY "sms_queue_insert_service" ON public.sms_queue
    FOR INSERT
    WITH CHECK (true);

-- Habilitar RLS en notifications
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Crear políticas para notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

-- Solo el usuario puede ver sus propias notificaciones
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- El servicio puede insertar notificaciones
CREATE POLICY "notifications_insert_service" ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- El usuario puede actualizar sus propias notificaciones (marcar como leídas)
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ========================================
-- PARTE 2: MEJORAR TRIGGER DE SINCRONIZACIÓN
-- ========================================

-- Función mejorada para sincronizar usuarios con profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_phone TEXT;
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Extraer teléfono de diferentes fuentes
    user_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'phone_number'
    );
    
    -- Extraer email
    user_email := COALESCE(
        NEW.email,
        NEW.raw_user_meta_data->>'email'
    );
    
    -- Extraer nombre
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        ''
    );
    
    -- Insertar perfil con los datos disponibles
    INSERT INTO public.profiles (
        id,
        email,
        phone,
        full_name,
        email_confirmed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_email,
        user_phone,
        user_name,
        NEW.email_confirmed_at IS NOT NULL,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        email_confirmed = EXCLUDED.email_confirmed,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- PARTE 3: SINCRONIZAR USUARIOS EXISTENTES
-- ========================================

-- Sincronizar todos los usuarios de auth.users que no tienen perfil
INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    email_confirmed,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.email, u.raw_user_meta_data->>'email'),
    COALESCE(u.phone, u.raw_user_meta_data->>'phone', u.raw_user_meta_data->>'phone_number'),
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
    u.email_confirmed_at IS NOT NULL,
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email_confirmed = EXCLUDED.email_confirmed,
    updated_at = NOW();

-- ========================================
-- PARTE 4: CREAR TABLA addresses SI NO EXISTE
-- ========================================

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'ES',
    phone TEXT,
    is_default BOOLEAN DEFAULT false,
    is_billing BOOLEAN DEFAULT false,
    is_shipping BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para addresses
DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;

CREATE POLICY "addresses_select_own" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(user_id, is_default);

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Mostrar resumen de lo que se hizo
SELECT 'RLS habilitado en sms_queue y notifications' as paso_1;
SELECT 'Trigger de sincronización mejorado' as paso_2;
SELECT COUNT(*) || ' usuarios sincronizados' as paso_3 FROM public.profiles;
SELECT 'Tabla addresses creada con RLS' as paso_4;

-- Verificar que las tablas tienen RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sms_queue', 'notifications', 'profiles', 'addresses')
ORDER BY tablename;

SELECT 'Script ejecutado exitosamente - Las tablas ya no deberían aparecer en rojo' as resultado;
