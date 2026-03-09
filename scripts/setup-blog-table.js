import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("[v0] Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
  console.log("[v0] Verificando tabla blog_posts...")

  // Intentar insertar un row de prueba para ver si la tabla existe
  const { error: checkError } = await supabase
    .from("blog_posts")
    .select("id")
    .limit(1)

  if (!checkError) {
    console.log("[v0] Tabla blog_posts ya existe y es accesible.")
    return
  }

  console.log("[v0] La tabla no existe. Error:", checkError.message)
  console.log("[v0] Por favor, ejecuta el siguiente SQL en Supabase Dashboard > SQL Editor:")
  console.log(`
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Semzo Privé',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_public_read" ON public.blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "blog_admin_all" ON public.blog_posts
  FOR ALL USING (true) WITH CHECK (true);
  `)
}

setup().catch(console.error)
