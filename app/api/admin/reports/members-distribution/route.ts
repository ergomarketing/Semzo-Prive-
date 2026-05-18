import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Categoria A - Miembro activo comercial (revenue / MRR / distribucion)
const CATEGORY_A_STATES = ["active", "cancelled_active", "past_due"]

// Precios en CENTIMOS para mostrar uniforme con Stripe
const MEMBERSHIP_PRICES_CENTS: Record<string, number> = {
  petite: 1999,
  essentiel: 5900,
  signature: 12999,
  prive: 29999,
}

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const [{ data: memberships }, { data: passes }] = await Promise.all([
      supabase
        .from("user_memberships")
        .select("user_id, membership_type, status")
        .in("status", CATEGORY_A_STATES),
      supabase.from("bag_passes").select("status"),
    ])

    // Agrupar por user_id - un usuario solo cuenta una vez (su mas reciente)
    const uniqueByUser = new Map<string, string>()
    memberships?.forEach((m) => {
      if (!uniqueByUser.has(m.user_id)) {
        uniqueByUser.set(m.user_id, (m.membership_type || "").toLowerCase())
      }
    })

    const membersByType: Record<string, number> = {
      petite: 0,
      essentiel: 0,
      signature: 0,
      prive: 0,
    }

    uniqueByUser.forEach((type) => {
      if (type in membersByType) membersByType[type] += 1
    })

    // MRR estimado desde categorias A
    let mrrCents = 0
    uniqueByUser.forEach((type) => {
      mrrCents += MEMBERSHIP_PRICES_CENTS[type] || 0
    })

    const passesAvailable = passes?.filter((p) => p.status === "available").length || 0
    const passesUsed = passes?.filter((p) => p.status === "used").length || 0

    return NextResponse.json({
      activeMembers: uniqueByUser.size,
      membersByType,
      mrrCents,
      passes: { available: passesAvailable, used: passesUsed, total: passes?.length || 0 },
    })
  } catch (error) {
    console.error("[v0] [reports/members-distribution] error:", error)
    return NextResponse.json(
      {
        activeMembers: 0,
        membersByType: { petite: 0, essentiel: 0, signature: 0, prive: 0 },
        mrrCents: 0,
        passes: { available: 0, used: 0, total: 0 },
      },
      { status: 200 },
    )
  }
}
