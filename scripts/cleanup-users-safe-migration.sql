-- =====================================================
-- LIMPIEZA CONTROLADA DE USUARIOS — VERSIÓN SEGURA
-- Fecha: 2026-01-05
-- Maneja tablas que pueden no existir sin romper la transacción
-- =====================================================

BEGIN;

-- PASO 1: Identificar IDs de usuarios a CONSERVAR
CREATE TEMP TABLE users_to_keep AS
SELECT id, email FROM auth.users
WHERE email IN (
  'mailbox@semzoprive.com',
  'wendyvanessagr@hotmail.com',
  'galvanicbelleza@gmail.com',
  'elbauldelascremas@gmail.com',
  'begoromero21@gmail.com'
);

-- Verificación de usuarios encontrados
SELECT 
  'USUARIOS A CONSERVAR:' as mensaje,
  email,
  id
FROM users_to_keep
ORDER BY email;

-- PASO 2: Función auxiliar para eliminar con verificación de tabla
CREATE OR REPLACE FUNCTION delete_from_table_if_exists(
  table_name TEXT,
  user_column TEXT DEFAULT 'user_id'
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  table_exists BOOLEAN;
BEGIN
  -- Verificar si la tabla existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND tables.table_name = delete_from_table_if_exists.table_name
  ) INTO table_exists;
  
  IF table_exists THEN
    -- Ejecutar DELETE dinámico
    EXECUTE format(
      'DELETE FROM %I WHERE %I NOT IN (SELECT id FROM users_to_keep)',
      table_name,
      user_column
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Tabla %: % registros eliminados', table_name, deleted_count;
  ELSE
    RAISE NOTICE 'Tabla % no existe, omitiendo...', table_name;
  END IF;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Eliminar registros relacionados en orden seguro
-- (Cada llamada verifica si la tabla existe antes de intentar DELETE)

SELECT delete_from_table_if_exists('shipment_notifications', 'user_id');
SELECT delete_from_table_if_exists('sms_verification_codes', 'user_id');
SELECT delete_from_table_if_exists('notifications', 'user_id');
SELECT delete_from_table_if_exists('admin_notifications', 'user_id');
SELECT delete_from_table_if_exists('admin_alerts', 'user_id');
SELECT delete_from_table_if_exists('waitlist', 'user_id');
SELECT delete_from_table_if_exists('wishlists', 'user_id');
SELECT delete_from_table_if_exists('bag_passes', 'user_id');
SELECT delete_from_table_if_exists('newsletter_subscriptions', 'user_id');
SELECT delete_from_table_if_exists('addresses', 'user_id');
SELECT delete_from_table_if_exists('membership_history', 'user_id');
SELECT delete_from_table_if_exists('audit_log', 'user_id');
SELECT delete_from_table_if_exists('payment_history', 'user_id');
SELECT delete_from_table_if_exists('identity_verifications', 'user_id');
SELECT delete_from_table_if_exists('subscriptions', 'user_id');
SELECT delete_from_table_if_exists('user_memberships', 'user_id');
SELECT delete_from_table_if_exists('pending_memberships', 'user_id');
SELECT delete_from_table_if_exists('reservations', 'user_id');

-- PASO 4: Eliminar perfiles (esta tabla DEBE existir)
DELETE FROM profiles 
WHERE id NOT IN (SELECT id FROM users_to_keep);

-- PASO 5: Eliminar usuarios de auth.users (esta tabla DEBE existir)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM users_to_keep);

-- PASO 6: Resetear usuarios conservados a estado inicial
UPDATE profiles
SET 
  membership_plan = 'free',
  membership_status = 'inactive',
  stripe_customer_id = NULL,
  stripe_subscription_id = NULL,
  subscription_end_date = NULL,
  updated_at = NOW()
WHERE id IN (SELECT id FROM users_to_keep);

-- PASO 7: Verificación final
SELECT 
  'USUARIOS RESTANTES:' as mensaje,
  COUNT(*) as total
FROM auth.users;

SELECT 
  'ESTADO FINAL DE USUARIOS CONSERVADOS:' as mensaje,
  p.email,
  p.membership_plan,
  p.membership_status,
  p.stripe_customer_id
FROM profiles p
WHERE p.id IN (SELECT id FROM users_to_keep)
ORDER BY p.email;

-- PASO 8: Limpiar
DROP FUNCTION IF EXISTS delete_from_table_if_exists(TEXT, TEXT);
DROP TABLE IF EXISTS users_to_keep;

COMMIT;

-- Resumen final
SELECT 
  'LIMPIEZA COMPLETADA' as status,
  (SELECT COUNT(*) FROM auth.users) as usuarios_restantes,
  (SELECT COUNT(*) FROM profiles) as perfiles_restantes;
