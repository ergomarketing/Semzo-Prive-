import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 === DEBUG SUPABASE ===")

    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
      SUPABASE_SERVICE_KEY: !!supabaseServiceKey,
    }

    console.log("Variables de entorno:", envStatus)

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: "Variables de entorno faltantes",
        env: envStatus,
      })
    }

    // Crear cliente público
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Verificar conexión
    const { data: testData, error: testError } = await supabase.from("profiles").select("count").limit(1)

    if (testError) {
      console.error("❌ Error conectando a Supabase:", testError)
      return NextResponse.json({
        success: false,
        error: "Error conectando a Supabase: " + testError.message,
        env: envStatus,
      })
    }

    // Contar usuarios en profiles
    const { count: profilesCount, error: countError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("❌ Error contando profiles:", countError)
    }

    // Verificar cliente admin si existe la key
    let adminStatus = "No disponible"
    let authUsersCount = 0

    if (supabaseServiceKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

        if (authError) {
          adminStatus = "Error: " + authError.message
        } else {
          adminStatus = "Conectado"
          authUsersCount = authUsers.users.length
        }
      } catch (error) {
        adminStatus = "Error: " + (error instanceof Error ? error.message : "Unknown")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Debug completado",
      data: {
        environment: envStatus,
        connection: "OK",
        profilesCount: profilesCount || 0,
        authUsersCount,
        adminClient: adminStatus,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ Error en debug:", error)
    return NextResponse.json({
      success: false,
      error: "Error interno: " + (error instanceof Error ? error.message : "Unknown"),
    })
  }
}
