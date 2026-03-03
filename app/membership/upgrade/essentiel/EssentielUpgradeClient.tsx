"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import MembershipUpgradeClient from "@/app/components/MembershipUpgradeClient"

const PLAN = {
  membershipType: "essentiel",
  billingCycle: "monthly",
  price: 59,
  label: "La introducción perfecta al mundo de los bolsos de lujo.",
  priceSuffix: "/mes",
  features: [
    "1 bolso por mes",
    "Envío gratuito",
    "Seguro incluido",
    "Atención al cliente prioritaria",
  ],
}

export default function EssentielUpgradeClient() {
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
