-- ============================================================================
-- RECREAR VISTAS SIN SECURITY DEFINER
-- ============================================================================
-- Este script elimina y recrea las vistas problemáticas sin SECURITY DEFINER
-- para eliminar la advertencia "UNRESTRICTED" en Supabase
-- ============================================================================

-- Eliminar las vistas existentes
DROP VIEW IF EXISTS public.shipments_summary CASCADE;
DROP VIEW IF EXISTS public.pending_shipments CASCADE;
DROP VIEW IF EXISTS public.return_statistics CASCADE;

-- ============================================================================
-- 1. shipments_summary - Resumen de envíos por estado
-- ============================================================================
CREATE VIEW public.shipments_summary 
WITH (security_invoker=true) AS
SELECT
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN carrier IS NOT NULL THEN 1 END) as with_carrier,
  AVG(cost) as avg_cost,
  MAX(created_at) as last_shipment
FROM shipments
GROUP BY status;

-- ============================================================================
-- 2. pending_shipments - Envíos pendientes de entrega
-- ============================================================================
CREATE VIEW public.pending_shipments
WITH (security_invoker=true) AS
SELECT
  s.id,
  s.reservation_id,
  s.status,
  s.carrier,
  s.tracking_number,
  s.estimated_delivery,
  p.full_name,
  p.email,
  b.name as bag_name,
  b.brand as bag_brand
FROM shipments s
JOIN reservations r ON s.reservation_id = r.id
JOIN profiles p ON r.user_id = p.id
JOIN bags b ON r.bag_id = b.id
WHERE s.status NOT IN ('delivered', 'returned', 'cancelled')
ORDER BY s.estimated_delivery ASC;

-- ============================================================================
-- 3. return_statistics - Tasa de devoluciones
-- ============================================================================
CREATE VIEW public.return_statistics
WITH (security_invoker=true) AS
SELECT
  DATE_TRUNC('month', r.created_at) as month,
  COUNT(*) as total_returns,
  COUNT(CASE WHEN r.status = 'processed' THEN 1 END) as processed_returns,
  AVG(r.refund_amount) as avg_refund,
  r.reason,
  COUNT(*) as count_by_reason
FROM returns r
GROUP BY DATE_TRUNC('month', r.created_at), r.reason
ORDER BY month DESC;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('shipments_summary', 'pending_shipments', 'return_statistics');
