-- Inspeccionar la función que probablemente causa el error

-- Ver la definición completa de handle_user_confirmation
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_user_confirmation';

-- Ver si hay triggers asociados
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    n.nspname AS schema_name,
    p.proname AS function_name,
    CASE t.tgtype::integer & 1 WHEN 1 THEN 'ROW' ELSE 'STATEMENT' END AS trigger_type,
    CASE t.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS trigger_timing,
    CASE 
        WHEN t.tgtype::integer & 4 <> 0 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 <> 0 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 <> 0 THEN 'UPDATE'
        ELSE 'UNKNOWN'
    END AS trigger_event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE p.proname = 'handle_user_confirmation'
AND NOT t.tgisinternal;

-- Ver hooks de Supabase Auth en la tabla de configuración
SELECT * FROM auth.hooks WHERE hook_name LIKE '%confirmation%' OR hook_name LIKE '%user%';
