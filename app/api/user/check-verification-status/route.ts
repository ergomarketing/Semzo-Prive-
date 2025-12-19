import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("identity_verified, identity_verified_at")
    .eq("id", userId)
    .single()

  return NextResponse.json({
    verified: profile?.identity_verified || false,
    verifiedAt: profile?.identity_verified_at,
  })
}
