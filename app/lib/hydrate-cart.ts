import { getSupabaseBrowser } from "@/app/lib/supabase"

/**
 * Construye el item de membresía en localStorage.cartItems a partir de
 * plan y bag (ambos opcionales). Fuente única de verdad para ambos
 * handlers de login (email+password y SMS) y cualquier otro punto donde
 * sea necesario rehidratar el carrito antes de redirigir a /cart.
 *
 * Idempotente: elimina cualquier membresía previa del cart antes de añadir.
 * No bloquea: si algo falla, devuelve false y el caller puede continuar.
 */
export async function hydrateCartFromUrl(
  plan: string | null | undefined,
  bag: string | null | undefined,
): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!plan && !bag) return false

  const membershipPrices: Record<string, { name: string; price: number }> = {
    essentiel: { name: "L'Essentiel", price: 59 },
    signature: { name: "Signature", price: 149 },
    prive: { name: "Privé", price: 279 },
  }

  try {
    const supabase = getSupabaseBrowser()

    let bagData: any = null
    if (bag && supabase) {
      const { data } = await supabase
        .from("bags")
        .select("name, brand, image_url, images, membership_type")
        .eq("id", bag)
        .maybeSingle()
      bagData = data
    }

    const membershipType = (plan || bagData?.membership_type || "").toLowerCase()
    const membership = membershipPrices[membershipType]
    if (!membership) return false

    const membershipItem = {
      id: `${membershipType}-membership-monthly${bag ? `-${bag}` : ""}`,
      name: membership.name.toUpperCase(),
      price: `${membership.price}€`,
      billingCycle: "monthly",
      description: bagData ? `${bagData.brand} ${bagData.name}` : `Membresía ${membership.name}`,
      image:
        bagData?.images?.[0] ||
        bagData?.image_url ||
        `/images/membership-${membershipType}.jpg`,
      brand: bagData?.brand || "Semzo Privé",
      itemType: "membership",
    }

    const existingCart = localStorage.getItem("cartItems")
    const cartItems = existingCart ? JSON.parse(existingCart) : []
    const withoutMembership = Array.isArray(cartItems)
      ? cartItems.filter((i: any) => i.itemType !== "membership")
      : []

    localStorage.setItem("cartItems", JSON.stringify([...withoutMembership, membershipItem]))
    return true
  } catch {
    return false
  }
}
