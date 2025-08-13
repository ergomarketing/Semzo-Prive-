import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      EMAIL_API_KEY: !!process.env.EMAIL_API_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "NOT_SET",
      NODE_ENV: process.env.NODE_ENV,
    }

    console.log("🔍 Environment Check:", envCheck)

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: "Variables de entorno verificadas",
    })
  } catch (error) {
    console.error("❌ Error verificando entorno:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error verificando variables de entorno",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
