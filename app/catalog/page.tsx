import type { Metadata } from "next"
import CatalogSection from "../components/catalog-section"
import { createClient } from "../lib/supabase/server"

// ISR: Revalidate every 10 minutes (600 seconds) - reduces function invocations
export const revalidate = 600

const BAG_SELECT_COLS =
  "id, slug, name, brand, color, description, retail_price, image_url, images, category, condition, status, membership_type"

async function fetchInitialBags() {
  try {
    const supabase = await createClient()

    // Intento 1: con display_order
    let { data, error } = await supabase
      .from("bags")
      .select(BAG_SELECT_COLS)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("brand", { ascending: true })

    // Fallback si display_order no existe en producción
    if (error) {
      const retry = await supabase.from("bags").select(BAG_SELECT_COLS).order("brand", { ascending: true })
      data = retry.data
      error = retry.error
    }

    if (error) {
      console.error("[catalog SSR] Error cargando bolsos:", error.message)
      return []
    }

    return data ?? []
  } catch (err) {
    console.error("[catalog SSR] Excepción:", err)
    return []
  }
}

export const metadata: Metadata = {
  title: "Alquiler de Bolsos de Lujo desde 59€/mes | Chanel y Dior",
  description:
    "Alquila bolsos originales de Chanel, Dior, Louis Vuitton, Fendi, Prada, Gucci y mas desde 59€/mes. Envio gratis, seguro incluido y autenticidad garantizada en Semzo Prive.",
  keywords: [
    "alquiler bolsos lujo",
    "alquilar bolso chanel",
    "alquilar bolso dior",
    "alquilar bolso louis vuitton",
    "alquilar bolso fendi",
    "alquilar bolso prada",
    "alquilar bolso gucci",
    "alquiler bolsos diseno",
    "bolsos de lujo originales",
    "suscripcion bolsos",
    "Semzo Prive",
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Semzo Prive",
    title: "Alquiler de Bolsos de Lujo desde 59€/mes | Semzo Prive",
    description:
      "Chanel, Dior, Louis Vuitton, Fendi, Prada y mas. Alquila bolsos originales con envio gratis y seguro incluido desde 59€/mes.",
    images: [
      {
        url: "/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Catalogo de bolsos de lujo en alquiler - Semzo Prive",
      },
    ],
    url: "https://semzoprive.com/catalog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alquiler de Bolsos de Lujo desde 59€/mes | Semzo Prive",
    description: "Chanel, Dior, Louis Vuitton y mas. Alquila bolsos originales con envio gratis y seguro incluido.",
    images: ["/images/hero-luxury-bags.jpeg"],
  },
  alternates: {
    canonical: "https://semzoprive.com/catalog",
  },
}

export default async function CatalogPage() {
  const initialBags = await fetchInitialBags()

  return (
    <main className="pt-24">
      <div className="bg-gradient-to-b from-rose-nude/10 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">
            Alquiler de Bolsos de Lujo desde 59€/mes
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Alquila bolsos originales de Chanel, Dior, Louis Vuitton, Fendi, Prada y mas marcas premium. Envio gratis,
            seguro incluido y autenticidad garantizada en cada pieza de nuestro catalogo.
          </p>
        </div>
      </div>
      <CatalogSection initialBags={initialBags} />
    </main>
  )
}
