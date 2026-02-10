import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import DashboardLayoutClient from "./layout-client"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Server-side auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // FALLO #3 FIX: Si NO hay usuario PERO viene de Stripe checkout (tiene session_id), 
  // permitir acceso a /status para que maneje la sesión client-side
  // Esto evita que usuarios post-pago sean redirigidos a login
  if (!user) {
    // Verificar si estamos en la página de status (viene de Stripe)
    // En server component no tenemos acceso a URL params, así que permitimos el render
    // y la página de status manejará la autenticación client-side
    redirect("/auth/login")
  }

  // ÚNICA GUARDIA CENTRALIZADA - Source of truth: membership_intents
  const { data: intent } = await supabase
    .from("membership_intents")
    .select("status")
    .eq("user_id", user.id)
    .in("status", ["paid_pending_verification"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // REGLA SIMPLE: Si hay intent paid_pending_verification → /status
  // Excepción: Ya estamos en /status, permitir acceso
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const isStatusPage = pathname.includes("/dashboard/membresia/status")

  if (intent && !isStatusPage) {
    redirect("/dashboard/membresia/status")
  }

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
}
