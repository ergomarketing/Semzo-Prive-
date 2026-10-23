"use client"

import { useTranslations } from "next-intl"
import ReferralSystem from "@/app/components/referral-system"
import { PageHeader } from "@/components/panel/page-header"

/**
 * Pagina de referidos dentro del dashboard de la socia.
 * Se integra en el layout con sidebar (app/dashboard/layout-client.tsx).
 * Reutiliza el componente <ReferralSystem /> que ya consume /api/referrals/me.
 */
export default function ReferidosPage() {
  const t = useTranslations("dashboardLayout")
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow={t("groupAccount")} title={t("menuInvite")} />
      <ReferralSystem />
    </div>
  )
}
