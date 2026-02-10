-- Verificar todas las funciones relacionadas con auth y profiles
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    (p.proname LIKE '%user%' OR p.proname LIKE '%profile%' OR p.proname LIKE '%auth%')
    AND n.nspname IN ('public', 'auth')
ORDER BY n.nspname, p.proname;

-- Verificar event triggers que podrían ejecutarse en operaciones DDL
SELECT * FROM pg_event_trigger;

-- Ver todos los triggers relacionados con profiles
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('profiles', 'users')
ORDER BY c.relname, t.tgname;
