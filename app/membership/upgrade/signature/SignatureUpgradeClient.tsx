"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import MembershipUpgradeClient from "@/app/components/MembershipUpgradeClient"

const PLAN = {
  membershipType: "signature",
  billingCycle: "monthly",
  price: 129,
  label: "La experiencia preferida por nuestras clientas más exigentes.",
  priceSuffix: "/mes",
  features: [
    "1 bolso por mes",
    "Envío express gratuito",
    "Seguro premium incluido",
    "Acceso a colecciones exclusivas",
    "Personal shopper dedicado",
  ],
}

export default function SignatureUpgradeClient() {
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
