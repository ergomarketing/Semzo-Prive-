import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from("user_memberships")
      .select("status, failed_payment_count")
      .eq("user_id", user.id)
      .maybeSingle()

    const { count: pendingPayments } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending")

    const isSuspended = membership?.status === "suspended"
    const hasPendingPayments = (pendingPayments || 0) > 0
    const hasFailedPayments = (membership?.failed_payment_count || 0) >= 3

    return NextResponse.json({
      canCheckout: !isSuspended && !hasFailedPayments,
      isSuspended,
      hasPendingPayments,
      hasFailedPayments,
      message: isSuspended
        ? "Tu cuenta está suspendida. Contacta soporte."
        : hasFailedPayments
          ? "Actualiza tu método de pago."
          : null,
    })
  } catch (error) {
    console.error("Error checking account status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
