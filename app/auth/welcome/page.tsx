"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

const MEMBERSHIP_PLANS: Record<string, { name: string; price: number; image: string }> = {
  essentiel: { name: "L'Essentiel", price: 59, image: "/images/membership-essentiel.jpg" },
  signature: { name: "Signature", price: 149, image: "/images/membership-signature.jpg" },
  prive: { name: "Privé", price: 279, image: "/images/membership-prive.jpg" },
}

export default function WelcomePage() {
  const router = useRouter()

  useEffect(() => {
    const savedUrl = localStorage.getItem("semzo_post_confirm_url")
    if (!savedUrl) {
      router.replace("/dashboard")
      return
    }

    localStorage.removeItem("semzo_post_confirm_url")

    const buildCartAndRedirect = async () => {
      try {
        const url = new URL(savedUrl, window.location.origin)
        const plan = url.searchParams.get("plan")
        const bagId = url.searchParams.get("bag")

        const supabase = getSupabaseBrowser()

        // Buscar info del bolso en Supabase si hay bag param
        let bagBrand = ""
        let bagName = ""
        let bagImage = ""
        let bagMembershipType = plan // usar el plan de la URL o inferirlo del bolso

        if (bagId) {
          const { data: bag } = await supabase
            .from("bags")
            .select("name, brand, image_url, images, membership_type")
            .eq("id", bagId)
            .maybeSingle()

          if (bag) {
            bagBrand = bag.brand || ""
            bagName = bag.name || ""
            bagImage = bag.images?.[0] || bag.image_url || ""
            // Si no hay plan en la URL, usar el membership_type del bolso
            if (!plan && bag.membership_type) {
              bagMembershipType = bag.membership_type
            }
          }
        }

        // Si no hay plan, redirigir sin construir carrito
        if (!bagMembershipType || !MEMBERSHIP_PLANS[bagMembershipType]) {
          router.replace(savedUrl)
          return
        }

        const membership = MEMBERSHIP_PLANS[bagMembershipType]
        if (!bagImage) bagImage = membership.image

        // Construir el item de membresía con el bolso en la descripción
        const membershipItem = {
          id: `${bagMembershipType}-membership-monthly`,
          name: membership.name.toUpperCase(),
          price: `${membership.price}€`,
          billingCycle: "monthly",
          description: bagBrand && bagName ? `${bagBrand} ${bagName}` : `Membresía ${membership.name}`,
          image: bagImage,
          brand: bagBrand || "Semzo Privé",
          itemType: "membership",
        }

        // Guardar en localStorage para que CartClient lo encuentre
        const existingCart = localStorage.getItem("cartItems")
        const cartItems = existingCart ? JSON.parse(existingCart) : []
        const withoutMembership = cartItems.filter((i: any) => i.itemType !== "membership")
        localStorage.setItem("cartItems", JSON.stringify([...withoutMembership, membershipItem]))
      } catch (e) {
        // Si falla, redirigir de todas formas
      }

      router.replace(savedUrl)
    }

    buildCartAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <p className="text-foreground font-sans text-lg">Cuenta verificada. Continuando tu compra...</p>
      <p className="text-muted-foreground font-sans text-sm">Seras redirigida en un momento</p>
    </div>
  )
}
