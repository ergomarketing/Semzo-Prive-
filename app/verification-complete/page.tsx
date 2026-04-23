import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import VerificationCompleteClient from "./client"

export default async function VerificationCompletePage({
  searchParams,
}: {
  searchParams: { userId?: string; intentId?: string; session_id?: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Si la membresía ya está activa, ir directo al dashboard
  const { data: intent } = await supabase
    .from("membership_intents")
    .select("status")
    .eq("user_id", user.id)
    .in("status", ["paid_pending_verification", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (intent?.status === "active") {
    redirect("/dashboard")
  }

  // Stripe redirige con ?session_id=vs_xxx — pasarlo al client para que
  // llame a Stripe directamente en vez de depender del webhook (que puede tardar)
  return (
    <VerificationCompleteClient
      userId={user.id}
      intentId={searchParams.intentId}
      sessionId={searchParams.session_id}
    />
  )
}
