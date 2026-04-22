-- Extiende las reservas admin (is_admin_rent = true) que seguian activas
-- a una fecha muy lejana para que los crons no las caduquen automaticamente.
-- Tambien reactiva reservas admin que fueron marcadas como "completed" por error
-- por el cron auto-update-reservation-status antes del fix.

-- 1. Extender end_date a +100 anos para todas las reservas admin activas
UPDATE public.reservations
SET
  end_date = (NOW() + INTERVAL '100 years'),
  updated_at = NOW()
WHERE is_admin_rent = true
  AND status IN ('active', 'confirmed', 'pending');

-- 2. Para bolsos actualmente "rented" que tienen una reserva admin marcada
-- "completed" y ninguna reserva activa real, restaurar la ultima reserva admin.
-- (Opcional — ejecutar solo si sabes que hay bolsos que deberian seguir bloqueados.)
-- Comentar las siguientes lineas si no quieres esta parte:

-- UPDATE public.reservations r
-- SET
--   status = 'active',
--   end_date = (NOW() + INTERVAL '100 years'),
--   updated_at = NOW()
-- FROM public.bags b
-- WHERE r.bag_id = b.id
--   AND r.is_admin_rent = true
--   AND r.status = 'completed'
--   AND b.status = 'rented'
--   AND NOT EXISTS (
--     SELECT 1 FROM public.reservations r2
--     WHERE r2.bag_id = b.id
--       AND r2.status IN ('active', 'confirmed', 'pending', 'in_progress', 'preparing')
--   );

SELECT
  id,
  bag_id,
  status,
  end_date,
  is_admin_rent
FROM public.reservations
WHERE is_admin_rent = true
ORDER BY updated_at DESC
LIMIT 20;
