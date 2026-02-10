-- Script para eliminar un usuario específico por teléfono
-- Ejecuta esto directamente en el SQL Editor de Supabase

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Encuentra el user_id por teléfono
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE phone = '+34624239394';  -- CAMBIA ESTE NÚMERO POR EL QUE NECESITES

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No se encontró usuario con ese teléfono';
        RETURN;
    END IF;

    RAISE NOTICE 'Eliminando usuario: %', v_user_id;

    -- Borra todo en el orden correcto para evitar errores de foreign key
    DELETE FROM notifications WHERE user_id = v_user_id;
    DELETE FROM admin_audit_log WHERE user_id = v_user_id;
    DELETE FROM gift_card_transactions WHERE gift_card_id IN (SELECT id FROM gift_cards WHERE user_id = v_user_id);
    DELETE FROM gift_cards WHERE user_id = v_user_id;
    DELETE FROM reservations WHERE user_id = v_user_id;
    DELETE FROM payment_methods WHERE user_id = v_user_id;
    DELETE FROM membership_history WHERE user_id = v_user_id;
    DELETE FROM user_memberships WHERE user_id = v_user_id;
    DELETE FROM profiles WHERE id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;

    RAISE NOTICE 'Usuario eliminado correctamente';
END $$;
