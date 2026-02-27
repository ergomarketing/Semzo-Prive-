import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const MEMBERSHIP_LIMITS: Record<string, number> = {
  petite: 1000,
  essentiel: 500,
  signature: 200,
  prive: 50,
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { membershipType } = await request.json()

    if (!MEMBERSHIP_LIMITS[membershipType]) {
      return NextResponse.json(
        {
          available: false,
          reason: "Tipo de membresía inválido",
        },
        { status: 400 },
      )
    }

    const { count } = await supabase
      .from("user_memberships")
      .select("*", { count: "exact", head: true })
      .eq("membership_type", membershipType)
      .eq("status", "active")

    const limit = MEMBERSHIP_LIMITS[membershipType]
    const available = (count || 0) < limit

    return NextResponse.json({
      available,
      reason: available ? null : `Límite alcanzado para membresía ${membershipType}`,
      currentCount: count,
      limit,
    })
  } catch (error) {
    console.error("Error checking availability:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
