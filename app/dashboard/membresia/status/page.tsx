import { Suspense } from "react"
import { MembershipStatusContent } from "./membership-status-content"

export default function MembershipStatusPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Cargando...</div>}>
        <MembershipStatusContent />
      </Suspense>
    </div>
  )
}
