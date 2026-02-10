-- Script para eliminar TODOS los usuarios de prueba
-- CUIDADO: Esto borra todos los usuarios con teléfonos +346...

DO $$
DECLARE
    user_record RECORD;
    deleted_count INT := 0;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT u.id, u.phone, u.email
        FROM auth.users u
        LEFT JOIN public.user_profiles up ON u.id = up.id
        WHERE u.phone LIKE '+346%' 
           OR up.phone_number LIKE '+346%'
           OR u.email LIKE '%@test%'
    LOOP
        -- Eliminar datos relacionados
        DELETE FROM public.notifications WHERE user_id = user_record.id;
        DELETE FROM public.audit_log WHERE user_id = user_record.id;
        DELETE FROM public.payment_methods WHERE user_id = user_record.id;
        DELETE FROM public.gift_card_transactions WHERE user_id = user_record.id;
        DELETE FROM public.gift_cards WHERE user_id = user_record.id;
        DELETE FROM public.reservations WHERE user_id = user_record.id;
        DELETE FROM public.membership_history WHERE user_id = user_record.id;
        DELETE FROM public.user_memberships WHERE user_id = user_record.id;
        DELETE FROM public.user_profiles WHERE id = user_record.id;
        DELETE FROM auth.users WHERE id = user_record.id;
        
        deleted_count := deleted_count + 1;
        RAISE NOTICE 'Usuario eliminado: % - % - %', user_record.id, user_record.phone, user_record.email;
    END LOOP;
    
    RAISE NOTICE 'Total de usuarios eliminados: %', deleted_count;
END $$;
