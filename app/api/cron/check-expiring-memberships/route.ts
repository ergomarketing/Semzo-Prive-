import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import { fetchProfilesById } from "@/lib/profile-lookup"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const emailService = EmailServiceProduction.getInstance()
    // Cliente de servicio: el cron no tiene sesion y RLS bloquearia la lectura.
    const supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Fuente de verdad: user_memberships. Solo se avisa a quien REALMENTE va a
    // perder el acceso (cancelo y termina su periodo). Una membresia que se
    // renueva sola no "expira": avisarla confundiria a la socia.
    const { data: expiringMemberships, error } = await supabase
      .from("user_memberships")
      .select("id, user_id, membership_type, end_date")
      .in("status", ["active", "cancelling", "cancelled"])
      .or("cancel_at_period_end.eq.true,status.in.(cancelling,cancelled)")
      .not("end_date", "is", null)
      .lte("end_date", in7Days.toISOString())
      .gte("end_date", now.toISOString())

    if (error) throw error

    let emailsSent = 0

    // user_memberships apunta a auth.users, no a profiles: los perfiles se leen aparte.
    const profilesById = await fetchProfilesById(supabase, (expiringMemberships || []).map((m) => m.user_id))

    for (const member of expiringMemberships || []) {
      const endDate = new Date(member.end_date)
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const profile = profilesById[member.user_id]

      if (profile?.email && (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1)) {
        await emailService.sendMembershipExpiringEmail({
          userName: profile.full_name || "Cliente",
          userEmail: profile.email,
          membershipType: member.membership_type,
          endDate: member.end_date,
          daysRemaining,
        })
        emailsSent++
      }
    }

    return NextResponse.json({
      success: true,
      checked: expiringMemberships?.length || 0,
      emailsSent,
    })
  } catch (error) {
    console.error("Error in expiring memberships cron:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
