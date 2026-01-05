import { NextResponse } from "next/server"
import { supabase } from "../../lib/supabase"

export async function GET() {
  try {
    // Verificar variables de entorno
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Intentar conectar a Supabase
    const { data, error } = await supabase.from("users").select("count").limit(1)

    return NextResponse.json({
      environment_variables: {
        NEXT_PUBLIC_SUPABASE_URL: hasUrl ? "✅ Configurada" : "❌ Falta",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: hasKey ? "✅ Configurada" : "❌ Falta",
        url_value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      },
      supabase_connection: {
        success: !error,
        error: error?.message || null,
        data: data ? "✅ Conectado" : "❌ Sin datos",
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: "Error general",
      message: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}
