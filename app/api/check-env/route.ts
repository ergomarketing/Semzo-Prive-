import { NextResponse } from "next/server"

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING",
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "SET" : "MISSING",
    EMAIL_API_KEY: process.env.EMAIL_API_KEY ? "SET" : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
    // Mostrar los primeros caracteres para debug (sin exponer las claves completas)
    SUPABASE_URL_PREVIEW: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
    SUPABASE_KEY_PREVIEW: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
  }

  console.log("=== ENV CHECK ===")
  console.log(envCheck)
  console.log("================")

  return NextResponse.json(envCheck)
}
