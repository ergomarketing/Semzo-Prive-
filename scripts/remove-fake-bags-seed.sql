-- Eliminar los bolsos de ejemplo insertados por el seed (no son el inventario real)
DELETE FROM public.bags
WHERE name IN (
  'Neverfull MM',
  'Speedy 30',
  'Soho Disco',
  'GG Marmont',
  'Timeless Classic Flap',
  'Boy Bag',
  'Galleria',
  'Re-Edition 2005',
  'Peekaboo',
  'Lady Dior',
  'Loulou'
);
