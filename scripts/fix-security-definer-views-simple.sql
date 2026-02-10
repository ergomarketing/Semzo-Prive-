-- Fix Security Definer Views
-- Remove SECURITY DEFINER by recreating views without it

-- Shipments summary
DROP VIEW IF EXISTS public.shipments_summary CASCADE;
CREATE OR REPLACE VIEW public.shipments_summary AS
SELECT 
  status,
  COUNT(*) as total,
  AVG(cost) as avg_cost,
  MAX(created_at) as last_shipment
FROM shipments
GROUP BY status;

-- Pending shipments
DROP VIEW IF EXISTS public.pending_shipments CASCADE;
CREATE OR REPLACE VIEW public.pending_shipments AS
SELECT
  s.id,
  s.reservation_id,
  s.status,
  s.carrier,
  s.tracking_number,
  s.estimated_delivery
FROM shipments s
WHERE s.status NOT IN ('delivered', 'returned', 'cancelled')
ORDER BY s.estimated_delivery ASC;

-- Return statistics
DROP VIEW IF EXISTS public.return_statistics CASCADE;
CREATE OR REPLACE VIEW public.return_statistics AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_returns,
  reason
FROM returns
GROUP BY DATE_TRUNC('month', created_at), reason
ORDER BY month DESC;
