-- PASO 1: Eliminar el trigger y función rotos
-- Ejecuta esto primero

-- Eliminar el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Eliminar la función rota
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verificar que se eliminaron
SELECT 'Trigger y función eliminados correctamente' AS status;
