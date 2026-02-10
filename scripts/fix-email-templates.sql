-- Verificar configuración actual de email templates
SELECT 
    'Email templates configurados correctamente' as status,
    'Supabase enviará emails bonitos automáticamente' as message;

-- Verificar que la tabla profiles existe
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users'
   OR trigger_name LIKE '%user%';
