-- Script para eliminar usuario por teléfono
-- Usuario: +34624239394
-- ID: 3742b414-d889-4164-8e78-97bd58929947

-- PASO 1: Eliminar de todas las tablas relacionadas primero
DELETE FROM gift_cards WHERE user_id = '3742b414-d889-4164-8e78-97bd58929947';
DELETE FROM membership_history WHERE user_id = '3742b414-d889-4164-8e78-97bd58929947';
DELETE FROM audit_log WHERE user_id = '3742b414-d889-4164-8e78-97bd58929947';
DELETE FROM reservations WHERE user_id = '3742b414-d889-4164-8e78-97bd58929947';
DELETE FROM wishlist WHERE user_id = '3742b414-d889-4164-8e78-97bd58929947';

-- PASO 2: Eliminar el perfil
DELETE FROM profiles WHERE id = '3742b414-d889-4164-8e78-97bd58929947';

-- PASO 3: Eliminar de Supabase Auth (esto requiere función admin)
-- Ejecutar esto desde el Dashboard de Supabase > SQL Editor
-- O usar la función delete_user si existe
SELECT auth.delete_user('3742b414-d889-4164-8e78-97bd58929947');
