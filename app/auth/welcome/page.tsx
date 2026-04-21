"use client"

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 4b del flujo de suscripcion: WELCOME (fallback)
 *
 * Solo se alcanza cuando el callback NO tiene plan/bag en URL ni user_metadata.
 * Como segundo intento lee localStorage (semzo_post_confirm_url) y recupera
 * el bolso desde la tabla bags para construir el item de membresia en el
 * carrito antes de redirigir a /cart.
 *
 * Si no hay contexto recuperable en ningun lado → /dashboard.
 * ============================================================================
 */

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

const MEMBERSHIP_PLANS: Record<string, { name: string; price: number; image: string }> = {
  essentiel: { name: "L'Essentiel", price: 59, image: "/images/membership-essentiel.jpg" },
  signature: { name: "Signature", price: 149, image: "/images/membership-signature.jpg" },
  prive: { name: "Privé", price: 279, image: "/images/membership-prive.jpg" },
}

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Leer plan y bag de la URL (vienen del callback) o de localStorage (fallback)
    const urlPlan = searchParams.get("plan")
    const urlBag = searchParams.get("bag")
    const savedUrl = localStorage.getItem("semzo_post_confirm_url")
    
    // Si no hay nada en URL ni localStorage, ir al dashboard
    if (!urlPlan && !urlBag && !savedUrl) {
      router.replace("/dashboard")
      return
    }

    localStorage.removeItem("semzo_post_confirm_url")

    const buildCartAndRedirect = async () => {
      // Declarar fuera del try para que redirectUrl las use aunque falle el try
      let plan = urlPlan
      let bagId = urlBag

      if (!plan && !bagId && savedUrl) {
        const url = new URL(savedUrl, window.location.origin)
        plan = url.searchParams.get("plan")
        bagId = url.searchParams.get("bag")
      }

      try {

        const supabase = getSupabaseBrowser()

        let bagBrand = ""
        let bagName = ""
        let bagImage = ""
        let bagMembershipType = plan

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

        // Si no hay plan válido, redirigir al dashboard
        if (!bagMembershipType || !MEMBERSHIP_PLANS[bagMembershipType]) {
          router.replace("/dashboard")
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

      // Construir URL de redirección con los parámetros
      let redirectUrl = "/dashboard"
      if (plan && bagId) {
        redirectUrl = `/cart?plan=${plan}&bag=${bagId}`
      } else if (plan) {
        redirectUrl = `/cart?plan=${plan}`
      } else if (bagId) {
        redirectUrl = `/cart?bag=${bagId}`
      }
      
      router.replace(redirectUrl)
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
