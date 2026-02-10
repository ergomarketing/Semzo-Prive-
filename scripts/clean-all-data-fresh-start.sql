-- SCRIPT DE LIMPIEZA COMPLETA - USAR CON PRECAUCIÓN
-- Este script elimina TODOS los datos de usuarios, membresías, reservas, pagos y auditoría
-- Mantiene la estructura de tablas intacta para comenzar de cero

-- ============================================
-- PASO 1: Eliminar datos en orden (respetando foreign keys)
-- ============================================

-- Eliminar DELETE de auth.users y DISABLE TRIGGER ALL para evitar errores de permisos

-- 1.1 Limpiar tablas dependientes primero
DELETE FROM audit_logs;
DELETE FROM membership_history;

-- 1.2 Limpiar pagos
DELETE FROM payments;

-- 1.3 Limpiar reservas
DELETE FROM reservations;

-- 1.4 Limpiar membresías de usuarios
DELETE FROM user_memberships 
WHERE user_id NOT IN (
  SELECT id FROM profiles WHERE role = 'admin'
);

-- 1.5 Limpiar gift cards
DELETE FROM gift_cards;

-- 1.6 Limpiar newsletter
DELETE FROM newsletter_subscribers;

-- 1.7 Limpiar direcciones
DELETE FROM addresses 
WHERE user_id NOT IN (
  SELECT id FROM profiles WHERE role = 'admin'
);

-- 1.8 Resetear bolsos a estado disponible
UPDATE bags 
SET status = 'available', 
    reserved_by = NULL,
    reserved_until = NULL;

-- 1.9 Limpiar perfiles (mantener admin)
DELETE FROM profiles 
WHERE role != 'admin' 
  AND email != 'ergomara2@gmail.com';

-- ============================================
-- PASO 2: Resetear secuencias (IDs) - OPCIONAL
-- ============================================
-- Descomenta si quieres que los nuevos registros comiencen desde ID = 1

-- ALTER SEQUENCE reservations_id_seq RESTART WITH 1;
-- ALTER SEQUENCE payments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE user_memberships_id_seq RESTART WITH 1;
-- ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;

-- ============================================
-- PASO 3: Verificación
-- ============================================

SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'user_memberships', COUNT(*) FROM user_memberships
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'bags (available)', COUNT(*) FROM bags WHERE status = 'available'
UNION ALL
SELECT 'admins preservados', COUNT(*) FROM profiles WHERE role = 'admin';

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Este script:
-- ✅ Elimina TODOS los datos de usuarios (excepto admin)
-- ✅ Limpia todas las transacciones, pagos, reservas
-- ✅ Resetea bolsos a estado disponible
-- ✅ Mantiene las tablas y estructura intacta
-- ✅ Preserva el usuario admin y sus datos
-- 
-- ⚠️ ESTO ES IRREVERSIBLE - Hacer backup antes de ejecutar
-- ⚠️ Los datos de Stripe NO se eliminan (customers, subscriptions)
-- ⚠️ Los usuarios en Supabase Auth permanecen (debes eliminarlos manualmente desde el panel Auth)
-- ⚠️ Para eliminar usuarios de Auth, ve a: Authentication > Users en Supabase Dashboard
