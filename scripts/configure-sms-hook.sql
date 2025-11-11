-- Configurar el SMS Hook en Supabase Auth
-- Este script debe ejecutarse en el SQL Editor de Supabase Dashboard

-- Configurar la función como SMS Hook
UPDATE auth.config 
SET 
  sms_provider = 'custom',
  sms_custom_hook_uri = 'send_custom_sms'
WHERE 
  id = 'default';

-- Verificar configuración
SELECT sms_provider, sms_custom_hook_uri 
FROM auth.config 
WHERE id = 'default';
