import type { Metadata } from "next"
import CatalogSection from "../components/catalog-section"
import CatalogGate from "../components/catalog-gate"
import { createClient } from "../lib/supabase/server"

// Render dinámico: el cliente Supabase usa cookies() y no se puede prerenderizar
export const dynamic = "force-dynamic"
export const revalidate = 0

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

  // Check si la usuaria esta logueada (socias siempre ven el catalogo)
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    isLoggedIn = false
  }

  // Schema CollectionPage + ItemList para el listado.
  // Google lo usa para:
  //  1) Entender que la pagina lista productos (mejor categorizacion).
  //  2) Generar sitelinks en SERP con las primeras fichas.
  //  3) Habilitar aparicion en Google Shopping organico.
  // Tomamos solo los primeros 12 bolsos para no inflar el HTML (Google
  // recomienda max 100, pero menos es mas limpio y rapido).
  const baseUrl = "https://semzoprive.com"
  const itemListElements = initialBags.slice(0, 12).map((bag, index) => {
    const slug = bag.slug || bag.id
    const url = `${baseUrl}/catalog/${slug}`
    const rawImage = bag.images?.[0] || bag.image_url || ""
    // Normalizar imagen: descartar /bags/*/foto-N rotas
    let image: string | undefined
    if (typeof rawImage === "string" && rawImage.length > 0) {
      const t = rawImage.trim()
      if (/^https?:\/\//i.test(t)) image = t
      else if (/^\/bags\//i.test(t)) image = undefined
      else if (t.startsWith("/")) image = `${baseUrl}${t}`
    }
    return {
      "@type": "ListItem",
      position: index + 1,
      url,
      name: `${bag.brand} ${bag.name}${bag.color && bag.color !== "Clasico" ? ` ${bag.color}` : ""}`,
      ...(image ? { image } : {}),
    }
  })

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Catalogo de bolsos de lujo en alquiler",
    description:
      "Catalogo completo de bolsos de lujo originales disponibles para alquiler: Chanel, Dior, Louis Vuitton, Fendi, Prada, Gucci y mas.",
    url: `${baseUrl}/catalog`,
    inLanguage: "es-ES",
    isPartOf: {
      "@type": "WebSite",
      name: "Semzo Prive",
      url: baseUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: initialBags.length,
      itemListElement: itemListElements,
    },
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Catalogo", item: `${baseUrl}/catalog` },
    ],
  }

  return (
    <main className="pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
      <CatalogGate isLoggedIn={isLoggedIn} />
    </main>
  )
}
