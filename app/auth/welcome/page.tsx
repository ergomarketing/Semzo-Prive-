"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    // Recuperar la URL guardada antes de que el usuario confirmara el email
    const savedUrl = localStorage.getItem("semzo_post_confirm_url")
    if (savedUrl) {
      localStorage.removeItem("semzo_post_confirm_url")
      router.replace(savedUrl)
    } else {
      router.replace("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-foreground font-sans">Verificando tu cuenta...</p>
    </div>
  )
}
