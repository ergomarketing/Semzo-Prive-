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

  const posts = [
    {
      slug: "como-alquilar-bolsos-lujo",
      title: "Cómo alquilar bolsos de lujo en Semzo Privé",
      content: "Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.\n\n## ¿Cómo funciona?\n\n1. Elige tu membresía.\n2. Selecciona tu bolso favorito.\n3. Recíbelo en casa con envío asegurado.\n4. Cámbialo cuando quieras.\n\n## Ventajas\n\n- Seguro incluido\n- Envío gratuito\n- Cambios ilimitados\n- Acceso a piezas icónicas",
      excerpt: "Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.",
      image_url: "/images/hero-luxury-bags.jpg",
      author: "Semzo Privé",
      published: true,
    },
    {
      slug: "por-que-alquilar-bolsos-es-inteligente",
      title: "Por qué alquilar bolsos de lujo es una decisión inteligente",
      content: "El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.\n\n## Beneficios clave\n\n- Rotación de estilo\n- Acceso a marcas exclusivas\n- Consumo consciente\n- Optimización financiera\n\nSemzo Privé redefine el lujo accesible.",
      excerpt: "El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.",
      image_url: "/images/lista-privada-bg.jpg",
      author: "Semzo Privé",
      published: true,
    },
  ]

  const { data, error } = await supabase
    .from("blog_posts")
    .upsert(posts, { onConflict: "slug" })
    .select()

  if (error) {
    console.error("[v0] Error:", error.message)
    console.error("[v0] Detalle:", error.details)
    process.exit(1)
  }

  console.log("[v0] Artículos insertados correctamente:", data?.length)
  console.log("[v0] Migración completada con éxito")
}

migrate()
