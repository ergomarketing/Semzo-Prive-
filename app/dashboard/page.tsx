"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Crown, Calendar, Gem, Home, Star, Diamond, Mail, CreditCard } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import NavbarImproved from "@/components/navbar-improved"
import type { User } from "@/lib/supabase"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const session = localStorage.getItem("session")
    if (!session) {
      router.push("/login")
    } else {
      const userData = JSON.parse(session)
      setUser(userData)
    }
  }, [router])

  return (
    <>
      <NavbarImproved />
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-4">Bienvenido al Dashboard</h1>
      </main>
    </>
  )
}
