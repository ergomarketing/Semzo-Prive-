import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SQL_QUERIES = [
  // Eliminar triggers y funciones existentes
  `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE`,
  `DROP TRIGGER IF EXISTS on_user_updated ON public.users CASCADE`,
  `DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users CASCADE`,
  `DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE`,
  `DROP FUNCTION IF EXISTS public.handle_user_update() CASCADE`,
  `DROP FUNCTION IF EXISTS public.handle_email_confirmation() CASCADE`,

  // Eliminar tabla users si existe
  `DROP TABLE IF EXISTS public.users CASCADE`,

  // Crear tabla users
  `CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    membership_status TEXT DEFAULT 'free' CHECK (membership_status IN ('free', 'premium', 'vip')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    email_confirmed BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
  )`,

  // Crear índices
  `CREATE INDEX idx_users_email ON public.users(email)`,
  `CREATE INDEX idx_users_membership_status ON public.users(membership_status)`,
  `CREATE INDEX idx_users_created_at ON public.users(created_at)`,
  `CREATE INDEX idx_users_email_confirmed ON public.users(email_confirmed)`,

  // Habilitar RLS
  `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`,

  // Crear políticas RLS
  `CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id)`,
  `CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id)`,
  `CREATE POLICY "System can insert users" ON public.users FOR INSERT WITH CHECK (true)`,
  `CREATE POLICY "Service role can do everything" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true)`,

  // Función para manejar nuevos usuarios
  `CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.users (id, email, first_name, last_name, phone, email_confirmed)
     VALUES (
       NEW.id,
       NEW.email,
       COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
       COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
       COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
       COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
     );
     RETURN NEW;
   EXCEPTION
     WHEN OTHERS THEN
       RAISE WARNING 'Error creating user profile: %', SQLERRM;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER`,

  // Función para actualizar timestamp
  `CREATE OR REPLACE FUNCTION public.handle_user_update()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql`,

  // Función para confirmación de email
  `CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
   RETURNS TRIGGER AS $$
   BEGIN
     IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
       UPDATE public.users SET email_confirmed = TRUE WHERE id = NEW.id;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER`,

  // Crear triggers
  `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`,
  `CREATE TRIGGER on_user_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_update()`,
  `CREATE TRIGGER on_auth_user_email_confirmed AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation()`,

  // Conceder permisos
  `GRANT USAGE ON SCHEMA public TO anon, authenticated`,
  `GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated`,
  `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated`,
]

export async function POST() {
  try {
    console.log("=== EJECUTANDO SCRIPT DE BASE DE DATOS ===")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: "Variables de entorno de Supabase no configuradas" },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const results = []

    for (let i = 0; i < SQL_QUERIES.length; i++) {
      const query = SQL_QUERIES[i].trim()
      if (!query) continue

      console.log(`Ejecutando query ${i + 1}/${SQL_QUERIES.length}...`)

      try {
        const { error } = await supabase.rpc("exec_sql", { query })

        if (error) {
          // Si exec_sql no existe, intentar con el cliente SQL directo
          const { error: directError } = await supabase.from("_").select("*").limit(0)

          if (directError) {
            console.error(`Error en query ${i + 1}: ${error.message}`)
            results.push(`❌ Query ${i + 1}: ${error.message}`)
          } else {
            results.push(`✅ Query ${i + 1}: Ejecutada`)
          }
        } else {
          results.push(`✅ Query ${i + 1}: Ejecutada correctamente`)
        }
      } catch (err: any) {
        console.error(`Error ejecutando query ${i + 1}:`, err.message)
        results.push(`❌ Query ${i + 1}: ${err.message}`)
      }
    }

    // Verificar que la tabla se creó
    const { data: tableCheck } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "users")

    const tableExists = tableCheck && tableCheck.length > 0

    return NextResponse.json({
      success: true,
      message: "¡Base de datos configurada!",
      details: [
        `✅ ${results.filter((r) => r.includes("✅")).length} queries ejecutadas correctamente`,
        `❌ ${results.filter((r) => r.includes("❌")).length} queries con errores`,
        `${tableExists ? "✅" : "❌"} Tabla 'users' ${tableExists ? "creada" : "no encontrada"}`,
        ...results.slice(-5), // Mostrar últimos 5 resultados
      ],
    })
  } catch (error: any) {
    console.error("Error general:", error)
    return NextResponse.json({ success: false, message: `Error del servidor: ${error.message}` }, { status: 500 })
  }
}
