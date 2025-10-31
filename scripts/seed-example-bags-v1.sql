-- Insertar los 5 bolsos de ejemplo marcados como "fuera_con_cliente"

INSERT INTO public.bags (name, brand, monthly_price, status) VALUES
  ('Saddle Bag', 'Dior', 189.00, 'fuera_con_cliente'),
  ('Peekaboo', 'Fendi', 199.00, 'fuera_con_cliente'),
  ('Structured Bag', 'Prada', 179.00, 'fuera_con_cliente'),
  ('Jackie', 'Gucci', 169.00, 'fuera_con_cliente'),
  ('FF Logo Pouch', 'Fendi', 149.00, 'fuera_con_cliente')
ON CONFLICT DO NOTHING;

-- Comentario: Estos bolsos están marcados como "fuera_con_cliente" para demostrar
-- el sistema de lista de espera y notificaciones
