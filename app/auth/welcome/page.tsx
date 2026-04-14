"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    // Recuperar la URL guardada antes de que el usuario confirmara el email
    // Puede ser /cart?plan=X&bag=Y o solo /cart o /dashboard
    const savedUrl = localStorage.getItem("semzo_post_confirm_url")
    if (savedUrl) {
      localStorage.removeItem("semzo_post_confirm_url")
      router.replace(savedUrl)
    } else {
      router.replace("/cart")
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <p className="text-foreground font-sans text-lg">Cuenta verificada. Continuando tu compra...</p>
      <p className="text-muted-foreground font-sans text-sm">Serás redirigido en un momento</p>
    </div>
  )
}
