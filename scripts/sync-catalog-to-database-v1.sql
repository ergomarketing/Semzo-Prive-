-- Corregir para usar solo las columnas que existen en la tabla bags
-- Columnas disponibles: id, name, brand, description, status, condition, monthly_price, retail_price, total_rentals, current_renter, rented_until, waiting_list, last_maintenance, created_at, updated_at

-- Sincronizar los 22 bolsos del catálogo público a la base de datos
-- Este script inserta todos los bolsos que están en el catálogo web

-- SIGNATURE BAGS (129€/mes)
INSERT INTO bags (id, name, brand, description, monthly_price, retail_price, condition, status, created_at, updated_at)
VALUES
  ('lv-pont-neuf-pm', 'Pont-Neuf PM', 'Louis Vuitton', 'El bolso Pont-Neuf de Louis Vuitton es un clásico atemporal confeccionado en cuero Epi, reconocible por su textura acanalada característica.', 129, 2450, 'excellent', 'available', NOW(), NOW()),
  
  ('lv-epi-wallet-chain', 'Pochette Félicie Epi', 'Louis Vuitton', 'Elegante cartera con cadena en cuero Epi multicolor. Diseño versátil que funciona como clutch de noche o bolso crossbody.', 129, 1450, 'excellent', 'available', NOW(), NOW()),
  
  ('celine-teen-triumph', 'Teen Triumph', 'Céline', 'Elegante bolso crossbody de Céline en cuero suave rosa nude. Diseño minimalista con el icónico logo dorado.', 129, 2100, 'excellent', 'available', NOW(), NOW()),
  
  ('loewe-gate', 'Gate', 'Loewe', 'El icónico bolso Gate de Loewe en cuero granulado marrón. Diseño arquitectónico con correas entrelazadas.', 129, 2200, 'excellent', 'available', NOW(), NOW()),
  
  ('gucci-jackie', 'Jackie', 'Gucci', 'El legendario bolso Jackie de Gucci en canvas GG Supreme con detalles en cuero marrón.', 129, 2500, 'excellent', 'available', NOW(), NOW()),
  
  ('prada-hobo', 'Hobo Bag', 'Prada', 'Elegante bolso hobo de Prada en cuero marrón cognac con forma de media luna.', 129, 2200, 'excellent', 'available', NOW(), NOW()),
  
  ('prada-bucket-saffiano', 'Bucket Saffiano', 'Prada', 'Bolso bucket de Prada en el icónico cuero Saffiano verde.', 129, 2000, 'excellent', 'available', NOW(), NOW()),
  
  ('fendi-ff-logo-pouch', 'FF Logo Pouch', 'Fendi', 'Elegante pouch de Fendi en cuero negro suave con el icónico logo FF dorado prominente.', 129, 2300, 'excellent', 'available', NOW(), NOW()),
  
  ('fendi-saddle', 'Saddle Bag', 'Fendi', 'El icónico bolso Saddle de Fendi en cuero rosa con el distintivo logo FF dorado.', 129, 2500, 'excellent', 'available', NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  retail_price = EXCLUDED.retail_price,
  condition = EXCLUDED.condition,
  updated_at = NOW();

-- L'ESSENTIEL BAGS (59€/mes)
INSERT INTO bags (id, name, brand, description, monthly_price, retail_price, condition, status, created_at, updated_at)
VALUES
  ('lv-reverie', 'Rêverie', 'Louis Vuitton', 'Bolso bucket en cuero marrón con detalles dorados y correa ajustable.', 59, 1350, 'excellent', 'available', NOW(), NOW()),
  
  ('marni-trunk-mini', 'Trunk Mini', 'Marni', 'Bolso crossbody en cuero rosa pálido con herrajes dorados.', 59, 890, 'excellent', 'available', NOW(), NOW()),
  
  ('patou-geometric-bag', 'Le Patou Geometric', 'PATOU', 'Bolso de diseño geométrico en cuero beige con forma semicircular distintiva.', 59, 950, 'excellent', 'available', NOW(), NOW()),
  
  ('loewe-gate-mini', 'Gate Mini', 'Loewe', 'La versión compacta del icónico Gate de Loewe en cuero beige.', 59, 1500, 'excellent', 'available', NOW(), NOW()),
  
  ('prada-structured-bag', 'Structured Bag', 'Prada', 'Bolso estructurado de Prada en cuero negro con diseño minimalista.', 59, 1600, 'excellent', 'available', NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  retail_price = EXCLUDED.retail_price,
  condition = EXCLUDED.condition,
  updated_at = NOW();

-- PRIVÉ BAGS (189€/mes)
INSERT INTO bags (id, name, brand, description, monthly_price, retail_price, condition, status, created_at, updated_at)
VALUES
  ('lv-epi-yellow-handbag', 'Malesherbes Epi', 'Louis Vuitton', 'Elegante bolso Louis Vuitton en cuero Epi amarillo vibrante.', 189, 2950, 'excellent', 'available', NOW(), NOW()),
  
  ('lady-dior', 'Lady Dior', 'Dior', 'El icónico bolso Lady Dior en cuero cannage negro con forro rojo vibrante.', 189, 4200, 'excellent', 'available', NOW(), NOW()),
  
  ('fendi-peekaboo', 'Peekaboo', 'Fendi', 'El legendario bolso Peekaboo de Fendi en cuero camel con forro FF signature.', 189, 4000, 'excellent', 'available', NOW(), NOW()),
  
  ('fendi-croissant', 'Croissant', 'Fendi', 'El emblemático bolso Croissant de Fendi en cuero blanco con el logo FENDI en relieve dorado.', 189, 3000, 'excellent', 'available', NOW(), NOW()),
  
  ('dior-saddle', 'Saddle Bag', 'Dior', 'El revolucionario bolso Saddle de Dior en cuero beige, diseñado por John Galliano.', 189, 3600, 'excellent', 'available', NOW(), NOW()),
  
  ('dior-vanity-case', 'Vanity Case', 'Dior', 'Elegante neceser Vanity Case de Dior en cuero cannage beige con logo Christian Dior en relieve.', 189, 3300, 'excellent', 'available', NOW(), NOW()),
  
  ('chanel-classic-flap', 'Classic Flap', 'Chanel', 'El legendario bolso Classic Flap de Chanel en cuero negro acolchado con forro rojo burgundy.', 189, 5500, 'excellent', 'available', NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  retail_price = EXCLUDED.retail_price,
  condition = EXCLUDED.condition,
  updated_at = NOW();

-- Verificar que se insertaron correctamente
SELECT COUNT(*) as total_bags FROM bags;
SELECT brand, COUNT(*) as count FROM bags GROUP BY brand ORDER BY brand;
