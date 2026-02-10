-- Crear triggers para sincronizar automáticamente auth.users con public.users y public.profiles

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Obtener email del nuevo usuario
    user_email := NEW.email;
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
    
    -- Insertar en public.users
    INSERT INTO public.users (
        id,
        email,
        full_name,
        created_at,
        updated_at,
        email_confirmed_at,
        is_active
    ) VALUES (
        NEW.id,
        user_email,
        user_name,
        NEW.created_at,
        NEW.updated_at,
        NEW.email_confirmed_at,
        true
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = EXCLUDED.updated_at,
        email_confirmed_at = EXCLUDED.email_confirmed_at;
    
    -- Insertar en public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        email_verified,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_email,
        user_name,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.email_confirmed_at IS NOT NULL,
        NEW.created_at,
        NEW.updated_at
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email_verified = EXCLUDED.email_verified,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log el error pero no fallar el registro
        RAISE WARNING 'Error en handle_new_user para usuario %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para manejar actualizaciones de usuarios
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar public.users
    UPDATE public.users SET
        email = NEW.email,
        updated_at = NEW.updated_at,
        email_confirmed_at = NEW.email_confirmed_at,
        last_sign_in_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
    
    -- Actualizar public.profiles
    UPDATE public.profiles SET
        email = NEW.email,
        email_verified = NEW.email_confirmed_at IS NOT NULL,
        updated_at = NEW.updated_at,
        last_login = NEW.last_sign_in_at
    WHERE id = NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_user_update para usuario %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para manejar eliminación de usuarios
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar de public.profiles
    DELETE FROM public.profiles WHERE id = OLD.id;
    
    -- Eliminar de public.users
    DELETE FROM public.users WHERE id = OLD.id;
    
    RETURN OLD;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_user_delete para usuario %: %', OLD.id, SQLERRM;
        RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Crear triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();

-- Verificar que los triggers se crearon
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;
