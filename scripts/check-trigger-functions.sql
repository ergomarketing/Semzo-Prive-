-- Script para ver exactamente qué están haciendo las funciones de los triggers

-- 1. Ver el código de la función handle_new_user()
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Ver el código de la función handle_user_update()
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'handle_user_update';

-- 3. Ver todos los triggers activos en auth.users
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
