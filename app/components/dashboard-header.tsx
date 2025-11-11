"use client"

import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  userName: string
  onLogout: () => void
}

export function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-serif text-2xl text-slate-900 hover:text-indigo-dark transition-colors">
            Semzo Privé
          </Link>

          {/* User Info y Actions */}
          <div className="flex items-center space-x-4">
            {/* User Greeting */}
            <div className="flex items-center space-x-2 text-slate-700">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Hola, {userName}</span>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
