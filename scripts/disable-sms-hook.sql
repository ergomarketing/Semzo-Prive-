-- Desactiva el hook SMS personalizado para eliminar el SMS duplicado.
-- El SMS nativo de Supabase (provider Twilio en dashboard) es suficiente.
-- Este hook enviaba un segundo SMS en paralelo causando el duplicado.

-- Verificar hooks activos antes de desactivar
SELECT * FROM supabase_functions.hooks WHERE hook_name = 'send_sms';

-- Desactivar el hook de SMS personalizado
DELETE FROM supabase_functions.hooks WHERE hook_name = 'send_sms';

-- Confirmar que fue eliminado
SELECT COUNT(*) AS hooks_sms_activos FROM supabase_functions.hooks WHERE hook_name = 'send_sms';
