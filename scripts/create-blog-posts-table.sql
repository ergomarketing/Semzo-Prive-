-- Create blog_posts table for Semzo Privé Magazine
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  author TEXT NOT NULL DEFAULT 'Semzo Privé',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast slug lookups
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (published, created_at DESC);

-- RLS: public can read published posts, only service role can write
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "blog_posts_admin_all" ON public.blog_posts
  FOR ALL USING (true)
  WITH CHECK (true);

-- Seed the two static example posts
INSERT INTO public.blog_posts (slug, title, content, excerpt, image_url, author, published, created_at, updated_at)
VALUES
(
  'como-alquilar-bolsos-lujo',
  'Cómo alquilar bolsos de lujo en Semzo Privé',
  E'Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.\n\n## ¿Cómo funciona?\n\n1. Elige tu membresía.\n2. Selecciona tu bolso favorito.\n3. Recíbelo en casa con envío asegurado.\n4. Cámbialo cuando quieras.\n\n## Ventajas\n\n- Seguro incluido\n- Envío gratuito\n- Cambios ilimitados\n- Acceso a piezas icónicas\n\nExplora nuestro catálogo y transforma tu estilo.',
  'Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.',
  '/images/hero-luxury-bags.jpg',
  'Semzo Privé',
  true,
  '2026-03-01T10:00:00Z',
  '2026-03-01T10:00:00Z'
),
(
  'por-que-alquilar-bolsos-es-inteligente',
  'Por qué alquilar bolsos de lujo es una decisión inteligente',
  E'El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.\n\n## Beneficios clave\n\n- Rotación de estilo\n- Acceso a marcas exclusivas\n- Consumo consciente\n- Optimización financiera\n\nSemzo Privé redefine el lujo accesible.',
  'El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.',
  '/images/lista-privada-bg.jpg',
  'Semzo Privé',
  true,
  '2026-03-05T10:00:00Z',
  '2026-03-05T10:00:00Z'
)
ON CONFLICT (slug) DO NOTHING;
