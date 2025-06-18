import { NextResponse } from "next/server"

export async function GET() {
  // Verificar variables de entorno directamente
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  }

  return NextResponse.json({
    message: "Debug de variables de entorno",
    variables: envVars,
    hasUrl: !!envVars.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    timestamp: new Date().toISOString(),
  })
}
