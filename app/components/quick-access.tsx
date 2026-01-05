"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function QuickAccess() {
  const goToDashboard = () => {
    // Simular login automático para demo
    if (typeof window !== "undefined") {
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userEmail", "demo@semzoprive.com")
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">🚀 Demo Rápido</h3>
        <div className="space-y-2">
          <Button
            onClick={goToDashboard}
            size="sm"
            className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90"
          >
            Ir al Dashboard
          </Button>
          <Link href="/auth/login">
            <Button size="sm" variant="outline" className="w-full">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" variant="outline" className="w-full">
              Registro
            </Button>
          </Link>
        </div>
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
          <strong>Credenciales demo:</strong>
          <br />
          demo@semzoprive.com
          <br />
          demo123
        </div>
      </div>
    </div>
  )
}
