-- SCRIPT PARA CORREGIR RLS Y SINCRONIZACIÓN DE PERFILES
-- Este script soluciona:
-- 1. Habilita RLS en tablas sms_queue y notifications (elimina el "Unrestricted" rojo)
-- 2. Crea perfiles automáticamente para usuarios registrados por SMS
-- 3. Sincroniza usuarios existentes que no tienen perfil

-- ============================================
-- PARTE 1: HABILITAR RLS EN TABLAS FALTANTES
-- ============================================

-- Habilitar RLS en sms_queue
ALTER TABLE IF EXISTS public.sms_queue ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en notifications
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para sms_queue (solo admin y el usuario dueño pueden ver)
DROP POLICY IF EXISTS "sms_queue_admin" ON public.sms_queue;
CREATE POLICY "sms_queue_admin" ON public.sms_queue
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email LIKE '%@semzoprive.com'
        )
    );

DROP POLICY IF EXISTS "sms_queue_owner" ON public.sms_queue;
CREATE POLICY "sms_queue_owner" ON public.sms_queue
    FOR SELECT
    USING (
        phone = (SELECT phone FROM public.profiles WHERE id = auth.uid())
    );

-- Políticas para notifications (usuarios pueden ver sus propias notificaciones)
DROP POLICY IF EXISTS "notifications_owner" ON public.notifications;
CREATE POLICY "notifications_owner" ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_admin" ON public.notifications;
CREATE POLICY "notifications_admin" ON public.notifications
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email LIKE '%@semzoprive.com'
        )
    );

-- ============================================
-- PARTE 2: MEJORAR TRIGGER PARA USUARIOS SMS
-- ============================================

-- Actualizar función para manejar mejor usuarios con teléfono (SMS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_phone TEXT;
    user_email TEXT;
BEGIN
    -- Extraer teléfono del usuario (puede venir en phone o en raw_user_meta_data)
    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');
    user_email := NEW.email;
    
    -- Insertar perfil nuevo
    INSERT INTO public.profiles (
        id,
        email,
        phone,
        full_name,
        first_name,
        last_name,
        email_verified,
        phone_verified,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        user_email,
        user_phone,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        CASE WHEN NEW.phone_confirmed_at IS NOT NULL THEN true ELSE false END,
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        email_verified = EXCLUDED.email_verified,
        phone_verified = EXCLUDED.phone_verified,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_new_user para %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 3: SINCRONIZAR USUARIOS EXISTENTES
-- ============================================

-- Crear perfiles para usuarios que no tienen uno (incluyendo usuarios SMS)
INSERT INTO public.profiles (
    id,
    email,
    phone,
    email_verified,
    phone_verified,
    is_active,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.phone, u.raw_user_meta_data->>'phone', ''),
    CASE WHEN u.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    CASE WHEN u.phone_confirmed_at IS NOT NULL THEN true ELSE false END,
    true,
    COALESCE(u.created_at, NOW()),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PARTE 4: CREAR TABLA ADDRESSES SI NO EXISTE
-- ============================================

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'ES',
    phone TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para addresses
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(is_default);

-- Habilitar RLS en addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Políticas para addresses
DROP POLICY IF EXISTS "addresses_owner_select" ON public.addresses;
CREATE POLICY "addresses_owner_select" ON public.addresses
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_owner_insert" ON public.addresses;
CREATE POLICY "addresses_owner_insert" ON public.addresses
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_owner_update" ON public.addresses;
CREATE POLICY "addresses_owner_update" ON public.addresses
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_owner_delete" ON public.addresses;
CREATE POLICY "addresses_owner_delete" ON public.addresses
    FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- PARTE 5: VERIFICACIÓN
-- ============================================

-- Verificar RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sms_queue', 'notifications', 'profiles', 'addresses')
ORDER BY tablename;

-- Verificar usuarios sin perfil
SELECT 
    COUNT(*) as usuarios_sin_perfil
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Verificar usuarios con teléfono
SELECT 
    u.id,
    u.email,
    COALESCE(u.phone, u.raw_user_meta_data->>'phone') as telefono,
    p.id IS NOT NULL as tiene_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.phone IS NOT NULL OR u.raw_user_meta_data->>'phone' IS NOT NULL;

-- Mostrar resumen
SELECT 
    'RLS configurado correctamente. Usuarios sincronizados con perfiles.' as resultado,
    (SELECT COUNT(*) FROM auth.users) as total_usuarios,
    (SELECT COUNT(*) FROM public.profiles) as total_perfiles;
