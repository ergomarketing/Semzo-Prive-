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

        if (!plan || !MEMBERSHIP_PLANS[plan]) {
          router.replace(savedUrl)
          return
        }

        const membership = MEMBERSHIP_PLANS[plan]
        let bagBrand = ""
        let bagName = ""
        let bagImage = membership.image

        // Buscar info del bolso en Supabase si hay bag param
        if (bagId) {
          const supabase = getSupabaseBrowser()
          const { data: bag } = await supabase
            .from("bags")
            .select("name, brand, image_url, images")
            .eq("id", bagId)
            .maybeSingle()

          if (bag) {
            bagBrand = bag.brand || ""
            bagName = bag.name || ""
            bagImage = bag.images?.[0] || bag.image_url || membership.image
          }
        }

        // Construir el item de membresía con el bolso en la descripción
        const membershipItem = {
          id: `${plan}-membership-monthly`,
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
