'use client';

import type React from "react"

// FALLO #3 FIX: Esta página NO debe tener protección server-side
// porque los usuarios vienen de Stripe y pueden haber perdido la sesión
// La autenticación se maneja client-side con useAuth() en la página
export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
