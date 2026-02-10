-- Fix handle_new_user trigger to properly save registration data
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();

-- Updated function to properly extract and save user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_phone TEXT;
    user_first_name TEXT;
    user_last_name TEXT;
    user_full_name TEXT;
BEGIN
    -- Extract data from auth.users
    user_email := NEW.email;
    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');
    user_first_name := NEW.raw_user_meta_data->>'first_name';
    user_last_name := NEW.raw_user_meta_data->>'last_name';
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        CASE 
            WHEN user_first_name IS NOT NULL AND user_last_name IS NOT NULL 
            THEN user_first_name || ' ' || user_last_name
            ELSE split_part(user_email, '@', 1)
        END
    );
    
    -- Insert/update in public.profiles with complete user data
    INSERT INTO public.profiles (
        id,
        email,
        phone,
        full_name,
        first_name,
        last_name,
        email_verified,
        member_type,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_email,
        user_phone,
        user_full_name,
        user_first_name,
        user_last_name,
        NEW.email_confirmed_at IS NOT NULL,
        'guest',
        NEW.created_at,
        NEW.updated_at
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        email_verified = EXCLUDED.email_verified,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_new_user para usuario %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to sync updates including email verification
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
DECLARE
    user_phone TEXT;
    user_full_name TEXT;
    user_first_name TEXT;
    user_last_name TEXT;
BEGIN
    -- Extract updated metadata
    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone');
    user_first_name := NEW.raw_user_meta_data->>'first_name';
    user_last_name := NEW.raw_user_meta_data->>'last_name';
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name'
    );
    
    -- Update public.profiles with latest data
    UPDATE public.profiles SET
        email = NEW.email,
        phone = COALESCE(user_phone, profiles.phone),
        full_name = COALESCE(user_full_name, profiles.full_name),
        first_name = COALESCE(user_first_name, profiles.first_name),
        last_name = COALESCE(user_last_name, profiles.last_name),
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

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

-- Verify triggers were created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
ORDER BY trigger_name;
