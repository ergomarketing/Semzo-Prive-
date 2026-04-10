import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = getServiceClient()

    const alerts: any[] = []

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Leer membresías desde user_memberships (FUENTE DE VERDAD)
    const { data: expiringMemberships } = await supabase
      .from("user_memberships")
      .select("id, user_id, membership_type, ends_at, profiles!user_memberships_user_id_fkey(full_name, email)")
      .eq("status", "active")
      .not("ends_at", "is", null)
      .lte("ends_at", in7Days.toISOString())
      .gte("ends_at", now.toISOString())

    for (const member of expiringMemberships || []) {
      const daysRemaining = Math.ceil(
        (new Date(member.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      alerts.push({
        id: `expiring-${member.id}`,
        type: "membership_expiring",
        severity: daysRemaining <= 3 ? "high" : "medium",
        title: `Membresía expirando en ${daysRemaining} día(s)`,
        description: `La membresía ${member.membership_type} de ${member.profiles?.full_name} expira pronto`,
        user_id: member.user_id,
        user_name: member.profiles?.full_name,
        user_email: member.profiles?.email,
        created_at: new Date().toISOString(),
      })
    }

    // Buscar pagos fallidos en user_memberships (fuente de verdad)
    const { data: failedPayments } = await supabase
      .from("user_memberships")
      .select("id, user_id, membership_type, profiles(full_name, email)")
      .eq("status", "past_due")

    for (const sub of failedPayments || []) {
      alerts.push({
        id: `payment-failed-${sub.id}`,
        type: "payment_failed",
        severity: "high",
        title: "Pago fallido",
        description: `El pago de la membresía ${sub.membership_type} ha fallado`,
        user_id: sub.user_id,
        user_name: sub.profiles?.full_name,
        user_email: sub.profiles?.email,
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
