-- Crear tabla de bolsos para el sistema de inventario
CREATE TABLE IF NOT EXISTS bags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
  condition VARCHAR(50) DEFAULT 'excellent' CHECK (condition IN ('excellent', 'very-good', 'good', 'fair')),
  total_rentals INTEGER DEFAULT 0,
  current_renter UUID REFERENCES profiles(id),
  rented_until TIMESTAMP WITH TIME ZONE,
  waiting_list JSONB DEFAULT '[]',
  last_maintenance TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  bag_id UUID REFERENCES bags(id) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  total_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos bolsos de ejemplo
INSERT INTO bags (name, brand, description, status, condition) VALUES
('Classic Flap Medium', 'Chanel', 'Icónico bolso Chanel en cuero acolchado', 'available', 'excellent'),
('Speedy 30', 'Louis Vuitton', 'Clásico bolso de mano en canvas monogram', 'available', 'very-good'),
('Lady Dior Medium', 'Dior', 'Elegante bolso con cannage y charms', 'maintenance', 'good'),
('Birkin 30', 'Hermès', 'Exclusivo bolso Birkin en cuero Togo', 'available', 'excellent'),
('Neverfull MM', 'Louis Vuitton', 'Espacioso tote en canvas Damier', 'available', 'very-good');

-- Políticas RLS
ALTER TABLE bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver los bolsos (para el catálogo público)
CREATE POLICY "Bolsos visibles para todos" ON bags FOR SELECT USING (true);

-- Política para que usuarios autenticados puedan ver sus reservas
CREATE POLICY "Usuarios pueden ver sus reservas" ON reservations FOR SELECT USING (auth.uid() = user_id);

-- Política para que admins puedan ver todo (usando emails específicos)
CREATE POLICY "Admins pueden ver todas las reservas" ON reservations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email IN ('ergomara@hotmail.com', 'admin@semzoprive.com')
  )
);

CREATE POLICY "Admins pueden gestionar bolsos" ON bags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.email IN ('ergomara@hotmail.com', 'admin@semzoprive.com')
  )
);
