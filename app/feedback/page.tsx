import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/app/lib/supabase/server"
import FeedbackForm from "@/app/components/feedback-form"

// Zona privada (requiere sesión), no debe indexarse.
export const metadata: Metadata = {
  title: "Tu opinión cuenta | SEMZO PRIVÉ",
  robots: { index: false, follow: false },
}

export default async function FeedbackPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/feedback")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-nude/10 via-white to-white flex items-center justify-center px-4 py-16 md:py-24">
      <FeedbackForm />
    </main>
  )
}
