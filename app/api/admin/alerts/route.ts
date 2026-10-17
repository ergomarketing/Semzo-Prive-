import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { fetchProfilesById } from "@/lib/profile-lookup"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const supabase = getServiceClient()

    const alerts: any[] = []

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Leer membresías desde user_memberships (FUENTE DE VERDAD)
    const { data: expiringMemberships } = await supabase
      .from("user_memberships")
      .select("id, user_id, membership_type, end_date")
      .in("status", ["active", "cancelling", "cancelled"])
      .or("cancel_at_period_end.eq.true,status.in.(cancelling,cancelled)")
      .not("end_date", "is", null)
      .lte("end_date", in7Days.toISOString())
      .gte("end_date", now.toISOString())

    // user_memberships apunta a auth.users, no a profiles: los perfiles se leen aparte.
    const { data: failedPayments } = await supabase
      .from("user_memberships")
      .select("id, user_id, membership_type")
      .eq("status", "past_due")

    const profilesById = await fetchProfilesById(supabase, [
      ...(expiringMemberships || []).map((m) => m.user_id),
      ...(failedPayments || []).map((m) => m.user_id),
    ])

    for (const member of expiringMemberships || []) {
      const profile = profilesById[member.user_id]
      const daysRemaining = Math.ceil(
        (new Date(member.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      alerts.push({
        id: `expiring-${member.id}`,
        type: "membership_expiring",
        severity: daysRemaining <= 3 ? "high" : "medium",
        title: `Membresía expirando en ${daysRemaining} día(s)`,
        description: `La membresía ${member.membership_type} de ${profile?.full_name} expira pronto`,
        user_id: member.user_id,
        user_name: profile?.full_name,
        user_email: profile?.email,
        created_at: new Date().toISOString(),
      })
    }

    // Pagos fallidos (user_memberships es la fuente de verdad)
    for (const sub of failedPayments || []) {
      const profile = profilesById[sub.user_id]
      alerts.push({
        id: `payment-failed-${sub.id}`,
        type: "payment_failed",
        severity: "high",
        title: "Pago fallido",
        description: `El pago de la membresía ${sub.membership_type} ha fallado`,
        user_id: sub.user_id,
        user_name: profile?.full_name,
        user_email: profile?.email,
        created_at: new Date().toISOString(),
      })
    }

    alerts.sort((a, b) => {
      if (a.severity === "high" && b.severity !== "high") return -1
      if (a.severity !== "high" && b.severity === "high") return 1
      return 0
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
