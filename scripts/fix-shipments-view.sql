-- Removiendo columna completed_at que no existe
DROP VIEW IF EXISTS shipments_summary CASCADE;

CREATE VIEW shipments_summary AS
SELECT 
  s.id,
  s.tracking_number,
  s.status,
  s.carrier,
  s.reservation_id,
  s.origin_address,
  s.destination_address,
  s.created_at,
  s.updated_at,
  s.estimated_delivery,
  s.actual_delivery,
  r.user_id,
  u.email as user_email,
  b.name as bag_name,
  CASE 
    WHEN s.actual_delivery IS NOT NULL 
    THEN EXTRACT(DAY FROM (s.actual_delivery - s.created_at))
    ELSE NULL
  END as days_to_deliver
FROM shipments s
LEFT JOIN reservations r ON s.reservation_id = r.id
LEFT JOIN auth.users u ON r.user_id = u.id
LEFT JOIN bags b ON r.bag_id = b.id;
