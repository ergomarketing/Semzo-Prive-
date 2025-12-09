-- Corregir membresía para erika ortiz (gift card SEMZO-8R62-XB6R)
-- 1. Buscar el usuario por el email asociado a la gift card
DO $$
DECLARE
    v_user_id uuid;
    v_gift_card_id uuid;
BEGIN
    -- Obtener el ID de la gift card
    SELECT id INTO v_gift_card_id FROM gift_cards WHERE code = 'SEMZO-8R62-XB6R';
    
    -- Buscar usuario por nombre (erika ortiz)
    SELECT id INTO v_user_id FROM profiles WHERE LOWER(full_name) LIKE '%erika ortiz%' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Usar solo columnas que existen en profiles
        UPDATE profiles SET
            membership_type = 'petite',
            updated_at = NOW()
        WHERE id = v_user_id;
        
        -- Crear o actualizar suscripción
        INSERT INTO subscriptions (user_id, membership_type, status, start_date, end_date, created_at)
        VALUES (v_user_id, 'petite', 'active', NOW(), NOW() + INTERVAL '1 year', NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            membership_type = 'petite',
            status = 'active',
            start_date = NOW(),
            end_date = NOW() + INTERVAL '1 year';
        
        -- Usar columna 'amount' en lugar de 'current_balance'
        IF v_gift_card_id IS NOT NULL THEN
            UPDATE gift_cards SET
                amount = 0,
                status = 'used',
                updated_at = NOW()
            WHERE id = v_gift_card_id;
        END IF;
        
        RAISE NOTICE 'Membresía activada para usuario %', v_user_id;
    ELSE
        RAISE NOTICE 'Usuario no encontrado';
    END IF;
END $$;

-- Usar solo columnas que existen
SELECT p.id, p.email, p.full_name, p.membership_type
FROM profiles p
WHERE LOWER(p.full_name) LIKE '%erika%' OR LOWER(p.full_name) LIKE '%ortiz%';

-- Usar 'amount' en lugar de 'current_balance'
SELECT code, original_amount, amount, status, recipient_name
FROM gift_cards WHERE code = 'SEMZO-8R62-XB6R';
