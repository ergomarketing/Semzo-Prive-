import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * CHECK VERIFICATION STATUS
 * 
 * Solo consulta estado real:
 * - profiles.identity_verified
 * - user_memberships.status
 * 
 * NO activa membresias.
 * NO toca membership_intents.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  // 1. Verificar identity desde profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("identity_verified")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  // 2. Verificar membresia desde user_memberships
  const { data: membership } = await supabase
    .from("user_memberships")
    .select("membership_type, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  return NextResponse.json({
    identity_verified: profile.identity_verified === true,
    membership_active: membership?.status === "active",
    membership_type: membership?.membership_type || null,
  })
}
