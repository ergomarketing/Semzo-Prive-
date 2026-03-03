"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/app/lib/supabase/client"
import MembershipUpgradeClient from "@/app/components/MembershipUpgradeClient"

const PLAN = {
  membershipType: "petite",
  billingCycle: "weekly",
  price: 19.99,
  label: "Favoritos del día a día. Sin compromiso.",
  priceSuffix: "/semana",
  features: ["1 bolso por semana", "Envío gratuito", "Seguro incluido", "Sin compromiso"],
}

export default function PetiteUpgradeClient() {
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
