import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import VerificationCompleteClient from "./client"

export default async function VerificationCompletePage({
  searchParams,
}: {
  searchParams: { userId?: string; intentId?: string }
}) {
  const supabase = await createClient()

  // CRÍTICO: Refrescar sesión del servidor después de Stripe Identity redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Verification complete - server session check:", user?.id || "NO SESSION")

  if (!user) {
    console.log("[v0] No user session after verification, redirecting to login")
    redirect("/auth/login")
  }

  // Verificar si la membresía está activa
  const { data: intent } = await supabase
    .from("membership_intents")
    .select("status")
    .eq("user_id", user.id)
    .in("status", ["paid_pending_verification", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  console.log("[v0] Intent status:", intent?.status)

  if (intent?.status === "active") {
    console.log("[v0] Membership active, redirecting to dashboard")
    redirect("/dashboard")
  }

  // Si sigue en paid_pending_verification, mostrar página de polling
  return <VerificationCompleteClient userId={user.id} intentId={searchParams.intentId} />
}
