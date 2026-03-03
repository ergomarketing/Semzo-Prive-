"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import MembershipUpgradeClient from "@/app/components/MembershipUpgradeClient"

const PLAN = {
  membershipType: "prive",
  billingCycle: "monthly",
  price: 189,
  label: "La experiencia definitiva para verdaderas conocedoras.",
  priceSuffix: "/mes",
  features: [
    "1 bolso por mes",
    "Envío express gratuito",
    "Seguro premium incluido",
    "Acceso VIP a nuevas colecciones",
    "Personal shopper dedicado",
    "Eventos exclusivos",
    "Servicio de conserjería",
  ],
}

export default function PriveUpgradeClient() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUserId(data.user.id)
    })
  }, [])

  if (!userId) return null

  return <MembershipUpgradeClient plan={PLAN} userId={userId} />
}
