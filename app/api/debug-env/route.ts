import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      EMAIL_API_KEY: !!process.env.EMAIL_API_KEY,
      NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    }

    console.log("=== SERVER ENV DEBUG ===")
    Object.entries(envVars).forEach(([key, value]) => {
      console.log(`${key}: ${value ? "SET" : "NOT SET"}`)
    })
    console.log("========================")

    return NextResponse.json(envVars)
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json({ error: "Error checking environment variables" }, { status: 500 })
  }
}
