import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const VERIFICATION_STEPS = [
  {
    name: "Verificar conexión a Supabase",
    action: async (supabase: any) => {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
      if (error) throw new Error(`Error de conexión: ${error.message}`)
      return "Conexión establecida correctamente"
    },
  },
  {
    name: "Verificar tabla profiles",
    action: async (supabase: any) => {
      const { data, error } = await supabase.from("profiles").select("id").limit(1)
      if (error && error.code === "42P01") {
        throw new Error("Tabla 'profiles' no existe - debe crearse manualmente")
      }
      return "Tabla 'profiles' existe y es accesible"
    },
  },
  {
    name: "Verificar usuarios registrados",
    action: async (supabase: any) => {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const userCount = authUsers?.users?.length || 0
      return `${userCount} usuarios encontrados en auth.users`
    },
  },
  {
    name: "Verificar perfiles de usuarios",
    action: async (supabase: any) => {
      const { data, error } = await supabase.from("profiles").select("*")
      if (error) throw new Error(`Error accediendo profiles: ${error.message}`)
      return `${data?.length || 0} perfiles encontrados en tabla profiles`
    },
  },
]

export async function POST() {
  try {
    console.log("=== VERIFICANDO CONFIGURACIÓN DE BASE DE DATOS ===")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Variables de entorno faltantes",
          details: [
            `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅ Configurada" : "❌ Faltante"}`,
            `SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? "✅ Configurada" : "❌ Faltante"}`,
          ],
          sqlScript: `-- Ejecuta este SQL en el SQL Editor de Supabase:
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  member_type TEXT DEFAULT 'free',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_confirmed BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para permitir que el sistema verifique usuarios durante login
CREATE POLICY "Allow auth verification" ON public.profiles
  FOR SELECT USING (true);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, email_confirmed)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const results = []
    let allSuccess = true

    for (const step of VERIFICATION_STEPS) {
      try {
        console.log(`Verificando: ${step.name}...`)
        const result = await step.action(supabase)
        results.push(`✅ ${step.name}: ${result}`)
      } catch (error: any) {
        console.error(`Error en ${step.name}:`, error.message)
        results.push(`❌ ${step.name}: ${error.message}`)
        allSuccess = false
      }
    }

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess ? "Base de datos configurada correctamente" : "Se encontraron problemas en la configuración",
      details: results,
      sqlScript: allSuccess
        ? null
        : `-- Si faltan tablas, ejecuta este SQL en Supabase:
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  member_type TEXT DEFAULT 'free',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_confirmed BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para permitir que el sistema verifique usuarios durante login
CREATE POLICY "Allow auth verification" ON public.profiles
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, email_confirmed)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.email_confirmed_at IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
    })
  } catch (error: any) {
    console.error("Error general:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Error del servidor: ${error.message}`,
        details: ["Revisa las variables de entorno y la configuración de Supabase"],
      },
      { status: 500 },
    )
  }
}
