-- Script de verificación post-limpieza
-- Ejecutar después de clean-all-data-fresh-start.sql

-- ============================================
-- Verificar estado de limpieza
-- ============================================

-- 1. Contar registros en todas las tablas principales
SELECT 
  'Perfiles (usuarios)' as categoria,
  COUNT(*) as total,
  CASE 
    WHEN COUNT(*) <= 1 THEN '✅ Limpio (solo admin)'
    ELSE '⚠️ Revisar'
  END as estado
FROM profiles
UNION ALL
SELECT 
  'Membresías activas',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Limpio'
    ELSE '⚠️ Hay membresías'
  END
FROM user_memberships WHERE status = 'active'
UNION ALL
SELECT 
  'Reservas',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Limpio'
    ELSE '⚠️ Hay reservas'
  END
FROM reservations
UNION ALL
SELECT 
  'Pagos registrados',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Limpio'
    ELSE '⚠️ Hay pagos'
  END
FROM payments
UNION ALL
SELECT 
  'Usuarios Auth',
  COUNT(*),
  CASE 
    WHEN COUNT(*) <= 1 THEN '✅ Limpio (solo admin)'
    ELSE '⚠️ Revisar'
  END
FROM auth.users
UNION ALL
SELECT 
  'Logs de auditoría',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Limpio'
    ELSE 'ℹ️ Hay logs (normal)'
  END
FROM audit_logs;

-- 2. Verificar que el admin sigue existiendo
SELECT 
  'Usuario Admin' as verificacion,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE role = 'admin') THEN '✅ Admin existe'
    ELSE '❌ ADMIN ELIMINADO - RESTAURAR INMEDIATAMENTE'
  END as estado;

-- 3. Verificar integridad de tablas críticas
SELECT 
  'Tabla bags (inventario)' as verificacion,
  COUNT(*) as total_bolsos,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Inventario preservado'
    ELSE '⚠️ No hay bolsos en catálogo'
  END as estado
FROM bags;

-- 4. Mostrar próximos IDs (deben estar en 1 o cerca)
SELECT 
  'Próximo ID profiles' as info,
  nextval('profiles_id_seq'::regclass) as valor,
  '(debe ser 2 o cercano si solo queda admin)' as nota;

-- Resetear después de verificar
SELECT setval('profiles_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM profiles), false);
