"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import MembershipUpgradeClient from "@/app/components/MembershipUpgradeClient"
import { Loader2 } from "lucide-react"

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
  const [checked, setChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setUserId(data.user.id)
      } else {
        router.push("/auth/login?redirect=/membership/upgrade/petite")
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
