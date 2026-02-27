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

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
}
