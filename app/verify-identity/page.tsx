"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function VerifyIdentityPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function startVerification() {
      try {
        const res = await fetch("/api/identity/create-session", {
          method: "POST",
        })

        const data = await res.json()

        if (!res.ok || !data.url) {
          setError(data.error || "No se pudo iniciar la verificación.")
          return
        }

        window.location.href = data.url
      } catch {
        setError("Error de conexión. Por favor intenta de nuevo.")
      }
    }

    startVerification()
  }, [])

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="font-serif text-xl text-foreground">
            No se pudo iniciar la verificación
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-6 py-2 border border-border text-foreground text-sm hover:bg-muted transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-serif text-xl text-foreground">
          Iniciando verificación de identidad...
        </p>
        <p className="text-muted-foreground text-sm">
          Serás redirigida a Stripe de forma segura.
        </p>
      </div>
    </main>
  )
}
