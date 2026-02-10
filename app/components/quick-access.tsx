"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function QuickAccess() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">🚀 Acceso Rápido</h3>
        <div className="space-y-2">
          <Link href="/auth/login">
            <Button size="sm" className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              Registro
            </Button>
          </Link>
          <Link href="/memberships">
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              Membresías
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
