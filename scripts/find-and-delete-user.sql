-- PASO 1: Encontrar al usuario
-- Ejecuta esto primero para ver dónde está el usuario

SELECT 
    u.id,
    u.email,
    u.phone,
    u.raw_user_meta_data,
    u.created_at,
    up.phone_number as profile_phone
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.phone = '+34624239394' 
   OR up.phone_number = '+34624239394'
   OR u.email LIKE '%624239394%';

-- PASO 2: Una vez que encuentres el user_id, copia el ID y úsalo aquí
-- Reemplaza 'USER_ID_AQUI' con el ID real que encontraste arriba

DO $$
DECLARE
    target_user_id UUID := 'USER_ID_AQUI'; -- CAMBIA ESTO
BEGIN
    -- Eliminar en orden por foreign keys
    DELETE FROM public.notifications WHERE user_id = target_user_id;
    DELETE FROM public.audit_log WHERE user_id = target_user_id;
    DELETE FROM public.payment_methods WHERE user_id = target_user_id;
    DELETE FROM public.gift_card_transactions WHERE user_id = target_user_id;
    DELETE FROM public.gift_cards WHERE user_id = target_user_id;
    DELETE FROM public.reservations WHERE user_id = target_user_id;
    DELETE FROM public.membership_history WHERE user_id = target_user_id;
    DELETE FROM public.user_memberships WHERE user_id = target_user_id;
    DELETE FROM public.user_profiles WHERE id = target_user_id;
    
    -- Eliminar de auth.users (requiere permisos de admin)
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RAISE NOTICE 'Usuario % eliminado correctamente', target_user_id;
END $$;
