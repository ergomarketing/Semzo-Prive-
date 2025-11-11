-- Paso 1: Agregar columnas faltantes a la tabla bags
ALTER TABLE bags 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS retail_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Agregar constraint único para (name, brand) antes del INSERT
CREATE UNIQUE INDEX IF NOT EXISTS bags_name_brand_unique ON bags(name, brand);

-- Paso 2: Insertar los 22 bolsos del catálogo público
-- Si ya existen (por nombre y marca), los actualiza
INSERT INTO bags (name, brand, description, price, retail_price, condition, status, image_url, category)
VALUES
  ('Classic Flap Medium', 'Chanel', 'Icónico bolso Chanel en cuero acolchado con cadena dorada', 450.00, 8500.00, 'excellent', 'available', '/images/bags/chanel-classic-flap.jpg', 'Shoulder Bags'),
  ('Boy Bag', 'Chanel', 'Moderno bolso Boy con herrajes plateados', 420.00, 7800.00, 'excellent', 'available', '/images/bags/chanel-boy.jpg', 'Shoulder Bags'),
  ('19 Bag', 'Chanel', 'Contemporáneo bolso 19 en cuero suave', 400.00, 7200.00, 'very-good', 'available', '/images/bags/chanel-19.jpg', 'Shoulder Bags'),
  
  ('Speedy 30', 'Louis Vuitton', 'Clásico bolso de mano en canvas monogram', 280.00, 1500.00, 'very-good', 'available', '/images/bags/lv-speedy.jpg', 'Handbags'),
  ('Neverfull MM', 'Louis Vuitton', 'Espacioso tote en canvas Damier', 300.00, 1800.00, 'very-good', 'available', '/images/bags/lv-neverfull.jpg', 'Totes'),
  ('Alma BB', 'Louis Vuitton', 'Elegante bolso estructurado en epi leather', 320.00, 2100.00, 'excellent', 'available', '/images/bags/lv-alma.jpg', 'Handbags'),
  ('Pochette Metis', 'Louis Vuitton', 'Versátil crossbody con solapa', 310.00, 2400.00, 'excellent', 'available', '/images/bags/lv-pochette.jpg', 'Crossbody'),
  
  ('Lady Dior Medium', 'Dior', 'Elegante bolso con cannage y charms', 480.00, 5500.00, 'good', 'maintenance', '/images/bags/dior-lady.jpg', 'Handbags'),
  ('Saddle Bag', 'Dior', 'Icónico bolso con forma de silla de montar', 420.00, 4800.00, 'excellent', 'available', '/images/bags/dior-saddle.jpg', 'Shoulder Bags'),
  ('Book Tote', 'Dior', 'Espacioso tote con bordado Dior Oblique', 380.00, 3500.00, 'very-good', 'available', '/images/bags/dior-book-tote.jpg', 'Totes'),
  
  ('Birkin 30', 'Hermès', 'Exclusivo bolso Birkin en cuero Togo', 1200.00, 15000.00, 'excellent', 'available', '/images/bags/hermes-birkin.jpg', 'Handbags'),
  ('Kelly 28', 'Hermès', 'Legendario bolso Kelly con cierre de candado', 1100.00, 12000.00, 'excellent', 'available', '/images/bags/hermes-kelly.jpg', 'Handbags'),
  ('Constance 24', 'Hermès', 'Sofisticado bolso con hebilla H', 950.00, 10000.00, 'very-good', 'available', '/images/bags/hermes-constance.jpg', 'Shoulder Bags'),
  
  ('GG Marmont Small', 'Gucci', 'Bolso acolchado con doble G', 280.00, 2200.00, 'excellent', 'available', '/images/bags/gucci-marmont.jpg', 'Shoulder Bags'),
  ('Dionysus Medium', 'Gucci', 'Bolso con cierre de tigre y cadena', 300.00, 2500.00, 'very-good', 'available', '/images/bags/gucci-dionysus.jpg', 'Shoulder Bags'),
  ('Jackie 1961', 'Gucci', 'Hobo bag con cierre de gancho', 320.00, 2800.00, 'excellent', 'available', '/images/bags/gucci-jackie.jpg', 'Hobo Bags'),
  
  ('Kate Medium', 'Saint Laurent', 'Elegante bolso con cadena y logo YSL', 290.00, 2400.00, 'excellent', 'available', '/images/bags/ysl-kate.jpg', 'Shoulder Bags'),
  ('LouLou Small', 'Saint Laurent', 'Bolso acolchado con solapa en Y', 310.00, 2600.00, 'very-good', 'available', '/images/bags/ysl-loulou.jpg', 'Shoulder Bags'),
  
  ('Galleria Medium', 'Prada', 'Bolso estructurado en saffiano leather', 350.00, 3200.00, 'excellent', 'available', '/images/bags/prada-galleria.jpg', 'Handbags'),
  ('Re-Edition 2005', 'Prada', 'Bolso de nylon con logo triangular', 250.00, 1500.00, 'very-good', 'available', '/images/bags/prada-re-edition.jpg', 'Shoulder Bags'),
  
  ('Baguette', 'Fendi', 'Icónico bolso baguette con logo FF', 320.00, 2900.00, 'excellent', 'available', '/images/bags/fendi-baguette.jpg', 'Shoulder Bags'),
  ('Peekaboo', 'Fendi', 'Sofisticado bolso con doble compartimento', 380.00, 4200.00, 'very-good', 'available', '/images/bags/fendi-peekaboo.jpg', 'Handbags')
ON CONFLICT (name, brand) 
DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  retail_price = EXCLUDED.retail_price,
  condition = EXCLUDED.condition,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  updated_at = NOW();
