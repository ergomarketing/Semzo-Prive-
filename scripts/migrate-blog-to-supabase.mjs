import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[v0] ERROR: Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function migrate() {
  console.log("[v0] Iniciando migración del magazine a Supabase...")

  // Crear tabla via RPC (ejecuta SQL directamente)
  const { error: createError } = await supabase.rpc("exec_sql", {
    sql: `
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
      CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts (slug);
      CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (published, created_at DESC);
      ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
      DROP POLICY IF EXISTS blog_posts_admin_all ON public.blog_posts;
      CREATE POLICY "blog_posts_public_read" ON public.blog_posts FOR SELECT USING (published = true);
      CREATE POLICY "blog_posts_admin_all" ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);
    `
  })

  if (createError) {
    console.log("[v0] RPC no disponible, intentando insertar directamente...")
  } else {
    console.log("[v0] Tabla blog_posts creada correctamente")
  }

  // Seed artículos de ejemplo
  const posts = [
    {
      slug: "como-alquilar-bolsos-lujo",
      title: "Cómo alquilar bolsos de lujo en Semzo Privé",
      content: "Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.\n\n## ¿Cómo funciona?\n\n1. Elige tu membresía.\n2. Selecciona tu bolso favorito.\n3. Recíbelo en casa con envío asegurado.\n4. Cámbialo cuando quieras.\n\n## Ventajas\n\n- Seguro incluido\n- Envío gratuito\n- Cambios ilimitados\n- Acceso a piezas icónicas",
      excerpt: "Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.",
      image_url: "/images/hero-luxury-bags.jpg",
      author: "Semzo Privé",
      published: true,
      created_at: "2026-03-01T10:00:00Z",
      updated_at: "2026-03-01T10:00:00Z",
    },
    {
      slug: "por-que-alquilar-bolsos-es-inteligente",
      title: "Por qué alquilar bolsos de lujo es una decisión inteligente",
      content: "El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.\n\n## Beneficios clave\n\n- Rotación de estilo\n- Acceso a marcas exclusivas\n- Consumo consciente\n- Optimización financiera\n\nSemzo Privé redefine el lujo accesible.",
      excerpt: "El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.",
      image_url: "/images/lista-privada-bg.jpg",
      author: "Semzo Privé",
      published: true,
      created_at: "2026-03-05T10:00:00Z",
      updated_at: "2026-03-05T10:00:00Z",
    },
  ]

  const { data, error: insertError } = await supabase
    .from("blog_posts")
    .upsert(posts, { onConflict: "slug" })
    .select()

  if (insertError) {
    console.error("[v0] Error insertando artículos:", insertError.message)
    console.log("[v0] Probablemente la tabla no existe aún. Créala manualmente en Supabase Dashboard.")
    process.exit(1)
  }

  console.log("[v0] Artículos insertados:", data?.length || 0)
  console.log("[v0] Migracion completada con exito")
}

migrate()
