-- Limpia registros huérfanos de usuarios que ya no existen en auth.users
-- IMPORTANTE: El orden importa debido a las foreign key constraints

-- Eliminar audit_log primero porque referencia profiles
-- 1. Eliminar audit_log sin usuario en auth
DELETE FROM audit_log
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. Eliminar notifications sin usuario en auth
DELETE FROM notifications
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 3. Eliminar gift_card_transactions sin usuario en auth
DELETE FROM gift_card_transactions
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 4. Eliminar reservations sin usuario en auth
DELETE FROM reservations
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 5. Eliminar membership_intents sin usuario en auth
DELETE FROM membership_intents
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 6. Eliminar user_memberships sin usuario en auth
DELETE FROM user_memberships
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 7. Eliminar profiles al final (después de todas las tablas que lo referencian)
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Mostrar resumen
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM user_memberships) as memberships_count,
  (SELECT COUNT(*) FROM membership_intents) as intents_count,
  (SELECT COUNT(*) FROM reservations) as reservations_count,
  (SELECT COUNT(*) FROM audit_log) as audit_log_count;
