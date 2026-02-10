import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const alerts: any[] = []

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: expiringMemberships } = await supabase
      .from("profiles")
      .select("id, full_name, email, membership_type, membership_end_date")
      .eq("membership_status", "active")
      .not("membership_end_date", "is", null)
      .lte("membership_end_date", in7Days.toISOString())
      .gte("membership_end_date", now.toISOString())

    for (const member of expiringMemberships || []) {
      const daysRemaining = Math.ceil(
        (new Date(member.membership_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      alerts.push({
        id: `expiring-${member.id}`,
        type: "membership_expiring",
        severity: daysRemaining <= 3 ? "high" : "medium",
        title: `Membresía expirando en ${daysRemaining} día(s)`,
        description: `La membresía ${member.membership_type} de ${member.full_name} expira pronto`,
        user_id: member.id,
        user_name: member.full_name,
        user_email: member.email,
        created_at: new Date().toISOString(),
      })
    }

    const { data: failedPayments } = await supabase
      .from("subscriptions")
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
