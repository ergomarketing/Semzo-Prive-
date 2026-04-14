"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

const MEMBERSHIP_ITEMS: Record<string, { id: string; name: string; price: string; description: string; image: string; brand: string }> = {
  essentiel: {
    id: "essentiel-membership-monthly",
    name: "L'Essentiel",
    price: "59€",
    description: "La experiencia de entrada al lujo accesible.",
    image: "/images/membership-essentiel.jpg",
    brand: "Semzo Privé",
  },
  signature: {
    id: "signature-membership-monthly",
    name: "Signature",
    price: "129€",
    description: "La experiencia preferida por nuestras clientas más exigentes.",
    image: "/images/membership-signature.jpg",
    brand: "Semzo Privé",
  },
  prive: {
    id: "prive-membership-monthly",
    name: "Privé",
    price: "189€",
    description: "El acceso más exclusivo a nuestra colección más codiciada.",
    image: "/images/membership-prive.jpg",
    brand: "Semzo Privé",
  },
}

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    const savedUrl = localStorage.getItem("semzo_post_confirm_url")
    if (savedUrl) {
      localStorage.removeItem("semzo_post_confirm_url")

      // Extraer plan y bag de la URL guardada para pre-popular el carrito
      try {
        const url = new URL(savedUrl, window.location.origin)
        const plan = url.searchParams.get("plan")

        if (plan && MEMBERSHIP_ITEMS[plan]) {
          // Verificar si el carrito ya tiene este item
          const existingCart = localStorage.getItem("cartItems")
          const cartItems = existingCart ? JSON.parse(existingCart) : []
          const alreadyInCart = cartItems.some((item: any) => item.id === MEMBERSHIP_ITEMS[plan].id)

          if (!alreadyInCart) {
            const membershipItem = {
              ...MEMBERSHIP_ITEMS[plan],
              billingCycle: "monthly",
              itemType: "membership",
            }
            // Mantener items no-membresía existentes y añadir la membresía
            const nonMembershipItems = cartItems.filter((item: any) =>
              !item.itemType || item.itemType !== "membership"
            )
            localStorage.setItem("cartItems", JSON.stringify([...nonMembershipItems, membershipItem]))
          }
        }
      } catch (e) {
        // No bloquear la redirección si falla el parsing
      }

      router.replace(savedUrl)
    } else {
      router.replace("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <p className="text-foreground font-sans text-lg">Cuenta verificada. Continuando tu compra...</p>
      <p className="text-muted-foreground font-sans text-sm">Seras redirigida en un momento</p>
    </div>
  )
}
