-- Fix Security Definer Views
-- Remove SECURITY DEFINER from views to use SECURITY INVOKER (default)

-- Drop and recreate shipments_summary without SECURITY DEFINER
DROP VIEW IF EXISTS public.shipments_summary CASCADE;
CREATE VIEW public.shipments_summary AS
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN carrier IS NOT NULL THEN 1 END) as with_carrier,
  AVG(cost) as avg_cost,
  MAX(created_at) as last_shipment
FROM shipments
GROUP BY status;

-- Drop and recreate pending_shipments without SECURITY DEFINER
DROP VIEW IF EXISTS public.pending_shipments CASCADE;
CREATE VIEW public.pending_shipments AS
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

-- Drop and recreate return_statistics without SECURITY DEFINER
DROP VIEW IF EXISTS public.return_statistics CASCADE;
CREATE VIEW public.return_statistics AS
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
