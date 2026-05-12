"use client"

import ReferralSystem from "@/app/components/referral-system"

/**
 * Pagina de referidos dentro del dashboard de la socia.
 * Se integra en el layout con sidebar (app/dashboard/layout-client.tsx).
 * Reutiliza el componente <ReferralSystem /> que ya consume /api/referrals/me.
 */
export default function ReferidosPage() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <ReferralSystem />
    </div>
  )
}
