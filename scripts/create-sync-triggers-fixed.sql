-- Crear triggers para sincronizar automáticamente auth.users con public.profiles

-- Función para crear perfil cuando se crea un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        phone,
        email_verified,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        true,
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Si ya existe, actualizar en lugar de insertar
        UPDATE public.profiles SET
            email = NEW.email,
            email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            updated_at = NOW()
        WHERE id = NEW.id;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log del error pero no fallar
        RAISE WARNING 'Error creando perfil para usuario %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar perfil cuando se actualiza un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles SET
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
        last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', phone),
        email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        updated_at = NOW(),
        last_login = CASE WHEN NEW.last_sign_in_at IS NOT NULL THEN NEW.last_sign_in_at ELSE last_login END
    WHERE id = NEW.id;
    
    -- Si no existe el perfil, crearlo
    IF NOT FOUND THEN
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            first_name,
            last_name,
            phone,
            email_verified,
            is_active,
            created_at,
            updated_at,
            last_login
        )
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            true,
            NOW(),
            NOW(),
            NEW.last_sign_in_at
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error actualizando perfil para usuario %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Crear triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

-- Verificar que los triggers se crearon
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name IN ('on_auth_user_created', 'on_auth_user_updated');

-- Mostrar mensaje de éxito
SELECT 'Triggers de sincronización creados exitosamente' as resultado;
