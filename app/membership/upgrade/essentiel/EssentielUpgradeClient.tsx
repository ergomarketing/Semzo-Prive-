"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import MembershipUpgradeClient from "@/app/components/MembershipUpgradeClient"
import { Loader2 } from "lucide-react"

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
  const [checked, setChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setUserId(data.user.id)
      } else {
        router.push("/auth/login?redirect=/membership/upgrade/essentiel")
      }
      setChecked(true)
    })
  }, [router])

  if (!checked || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  return <MembershipUpgradeClient plan={PLAN} userId={userId} />
}
