import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const emailService = EmailServiceProduction.getInstance()
    const supabase = await createClient()

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { data: expiringMemberships, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, membership_type, membership_end_date")
      .eq("membership_status", "active")
      .not("membership_end_date", "is", null)
      .lte("membership_end_date", in7Days.toISOString())
      .gte("membership_end_date", now.toISOString())

    if (error) throw error

    let emailsSent = 0

    for (const member of expiringMemberships || []) {
      const endDate = new Date(member.membership_end_date)
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
        await emailService.sendMembershipExpiringEmail({
          userName: member.full_name || "Cliente",
          userEmail: member.email,
          membershipType: member.membership_type,
          endDate: member.membership_end_date,
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
