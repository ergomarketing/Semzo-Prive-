import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 === DIAGNÓSTICO DE CONFIGURACIÓN SUPABASE ===")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    console.log("🔧 Variables de entorno:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl, supabaseUrl?.substring(0, 30) + "...")
    console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseAnonKey, supabaseAnonKey?.substring(0, 10) + "...")
    console.log("- SUPABASE_SERVICE_KEY:", !!supabaseServiceKey, supabaseServiceKey?.substring(0, 10) + "...")

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: "Variables de entorno faltantes",
        details: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey,
          hasServiceKey: !!supabaseServiceKey,
        },
      })
    }

    // Probar conexión con cliente anónimo
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log("🔄 Probando conexión...")

    // Probar obtener configuración de auth
    const { data: authConfig, error: authError } = await supabase.auth.getSession()

    console.log("📊 Resultado de getSession:")
    console.log("- Data:", !!authConfig)
    console.log("- Error:", !!authError)

    // Probar con service key si está disponible
    let serviceKeyTest = null
    if (supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

        serviceKeyTest = {
          success: !usersError,
          userCount: users?.users?.length || 0,
          error: usersError?.message,
        }

        console.log("📊 Test con service key:")
        console.log("- Success:", !usersError)
        console.log("- User count:", users?.users?.length || 0)
        console.log("- Error:", usersError?.message)
      } catch (error) {
        serviceKeyTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey,
        url: supabaseUrl?.substring(0, 30) + "...",
      },
      authTest: {
        success: !authError,
        error: authError?.message,
      },
      serviceKeyTest,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error en diagnóstico:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
