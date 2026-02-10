-- Verificar si existe constraint UNIQUE en phone
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
    AND kcu.column_name = 'phone'
    AND tc.constraint_type = 'UNIQUE';

-- Si NO existe, crearlo
DO $$
BEGIN
    -- Primero eliminar duplicados si existen
    DELETE FROM public.profiles a
    USING public.profiles b
    WHERE a.id > b.id 
        AND a.phone = b.phone 
        AND a.phone IS NOT NULL
        AND a.phone != '';

    -- Crear constraint UNIQUE si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name = 'profiles_phone_unique'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
        
        RAISE NOTICE 'Constraint UNIQUE agregado a profiles.phone';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE ya existe en profiles.phone';
    END IF;
END $$;

-- Verificar resultado final
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
    AND kcu.column_name = 'phone'
    AND tc.constraint_type = 'UNIQUE';
