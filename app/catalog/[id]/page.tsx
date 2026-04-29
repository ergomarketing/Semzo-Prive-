import type { Metadata } from "next"
import { redirect } from "next/navigation"
import BagDetail from "../../components/bag-detail"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

// Detecta si el segmento de URL es un UUID v4 (formato 8-4-4-4-12)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (s: string) => UUID_REGEX.test(s)

// Busca un bolso aceptando slug o id. Si llega UUID y existe slug, devuelve la fila completa
// para que la pagina pueda decidir hacer redirect.
async function fetchBagByIdOrSlug(idOrSlug: string) {
  if (!supabaseUrl || !supabaseKey) return null
  const supabase = createClient(supabaseUrl, supabaseKey)

  if (isUuid(idOrSlug)) {
    const { data } = await supabase.from("bags").select("*").eq("id", idOrSlug).single()
    return data
  }
  const { data } = await supabase.from("bags").select("*").eq("slug", idOrSlug).single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const data = await fetchBagByIdOrSlug(id)

  if (data) {
    const hasColor = data.color && data.color.trim() !== "" && data.color !== "Clasico"
    const colorSuffix = hasColor ? ` ${data.color}` : ""
    const bagName = `${data.brand} ${data.name}${colorSuffix}`
    const price =
      data.price || (data.membership_type === "prive" ? 279 : data.membership_type === "signature" ? 149 : 59)
    // URL canonica SIEMPRE con slug (si existe), nunca con UUID
    const canonicalPath = data.slug || data.id
    const canonical = `https://semzoprive.com/catalog/${canonicalPath}`

    // Title SEO 50-60 chars. Marca+modelo+color PRIMERO (lo que la gente busca),
    // luego intencion+precio. Si cabe, anadimos branding "Semzo Prive".
    const baseTitle = `${bagName} - Alquiler desde ${price}€/mes`
    const title = baseTitle.length <= 47 ? `${baseTitle} | Semzo Prive` : baseTitle
    // Meta description orientada a conversion (CTR en SERP): accion + producto + beneficio + envio.
    const description = `Alquila el ${bagName} desde ${price}€/mes. Accede a bolsos de lujo sin comprarlos. Envio rapido y seguro con Semzo Prive.`

    return {
      title,
      description,
      keywords: [
        // Variaciones de keyword principal para evitar canibalizacion y cubrir long-tail
        `alquiler bolso ${data.brand}`,
        `bolso ${data.brand} alquiler`,
        `alquilar ${data.brand} ${data.name}`,
        `${data.brand} ${data.name}`,
        ...(hasColor ? [`${data.brand} ${data.color}`, `bolso ${data.color}`] : []),
        "alquiler bolsos lujo",
        "bolso lujo alquiler",
        "alquilar bolso de lujo",
        "Semzo Prive",
      ],
      // openGraph y twitter NO declaran "images" aqui.
      // Next.js detecta automaticamente /app/catalog/[id]/opengraph-image.tsx
      // y la usa como og:image y twitter:image. Esa imagen dinamica incluye
      // marca + modelo + color + precio + branding, ideal para shares en redes.
      openGraph: {
        type: "website",
        locale: "es_ES",
        title,
        description,
        url: canonical,
        siteName: "Semzo Prive",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
      alternates: {
        canonical,
      },
    }
  }

  return {
    title: "Bolso de Lujo",
    description: "Descubre este elegante bolso de lujo disponible para alquiler en Semzo Prive.",
  }
}

export default async function BagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await fetchBagByIdOrSlug(id)

  // Si llego un UUID en la URL pero el bolso tiene slug, hacemos redirect 301 al slug.
  // Esto consolida autoridad SEO en una sola URL canonica y respeta backlinks viejos.
  if (data && isUuid(id) && data.slug && data.slug !== id) {
    redirect(`/catalog/${data.slug}`)
  }

  let bag = null
  let relatedBags: any[] = []

  if (data) {
    bag = {
      id: data.id,
      slug: data.slug || null,
      name: data.name,
      brand: data.brand,
      description:
        data.description ||
        `Elegante bolso ${data.brand} ${data.name}. Un diseno exclusivo que combina lujo y funcionalidad.`,
      price: `${data.price}€/mes`,
      retailPrice: `${data.retail_price}€`,
      images: data.images || [data.image_url, data.image_url, data.image_url],
      membership: data.membership_type || "essentiel",
      color: data.color || "Clasico",
      material: data.material || "Cuero premium",
      dimensions: data.dimensions || "Medidas estandar",
      condition: data.condition || "Excelente",
      year: data.year || "2023",
      availability: {
        status: data.status === "available" ? ("available" as const) : ("rented" as const),
      },
      rating: data.rating || 4.8,
      reviews: data.reviews || 50,
      features: data.features || [
        "Diseno iconico y atemporal",
        "Materiales de la mas alta calidad",
        "Perfecto para ocasiones especiales",
        "Compartimentos organizados",
        "Herrajes premium",
      ],
      careInstructions: data.care_instructions || [
        "Evitar el contacto con agua y humedad excesiva",
        "Guardar en lugar seco y ventilado",
        "Limpiar con pano suave y seco",
        "Evitar exposicion directa al sol",
      ],
    }

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data: relatedData } = await supabase
          .from("bags")
          .select("id, slug, name, brand, price, image_url, images, membership_type")
          .neq("id", data.id)
          .eq("status", "available")
          .limit(3)

        if (relatedData) {
          relatedBags = relatedData.map((item) => ({
            id: item.id,
            slug: item.slug || null,
            name: item.name,
            brand: item.brand,
            price: item.price
              ? `${item.price}€/mes`
              : item.membership_type === "prive"
                ? "279€/mes"
                : item.membership_type === "signature"
                  ? "149€/mes"
                  : "59€/mes",
            image: item.images?.[0] || item.image_url || "/placeholder.svg",
            membership: item.membership_type || "essentiel",
          }))
        }
      } catch (err) {
        console.error("[v0] Supabase related bags error:", err)
      }
    }
  }

  if (!bag) {
    return (
      <main className="min-h-screen bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-serif text-slate-900 mb-4">Bolso no encontrado</h1>
          <p className="text-slate-600 mb-8">El bolso que buscas no existe o ha sido removido.</p>
          <Link href="/catalog" className="inline-flex items-center text-indigo-dark hover:underline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Catalogo
          </Link>
        </div>
      </main>
    )
  }

  // URL canonica SIEMPRE con slug si existe
  const canonicalPath = bag.slug || bag.id

  // Mapear condicion del bolso a schema.org
  const conditionRaw = (bag.condition || "").toLowerCase()
  const itemCondition =
    conditionRaw.includes("nuevo") || conditionRaw.includes("new")
      ? "https://schema.org/NewCondition"
      : "https://schema.org/UsedCondition"

  // Breadcrumb structured data (Home > Catalogo > Marca > Modelo)
  // Google lo muestra como ruta de navegacion en el SERP, mejora CTR.
  // Nota: la marca NO se enlaza aun (no existe ruta cluster por marca). En Fase 2D
  // crearemos /catalog/marca/[brand] y actualizaremos aqui el "item" del position 3.
  const productName = `${bag.brand} ${bag.name}${bag.color && bag.color !== "Clasico" ? ` ${bag.color}` : ""}`
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://semzoprive.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catalogo",
        item: "https://semzoprive.com/catalog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: bag.brand,
        // Sin "item" hasta tener cluster por marca (Fase 2D).
        // schema.org permite ListItem sin item, Google lo acepta como nodo intermedio.
      },
      {
        "@type": "ListItem",
        position: 4,
        name: productName,
        item: `https://semzoprive.com/catalog/${canonicalPath}`,
      },
    ],
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    brand: {
      "@type": "Brand",
      name: bag.brand,
    },
    description: bag.description,
    image: bag.images,
    color: bag.color,
    material: bag.material,
    itemCondition,
    sku: bag.id,
    offers: {
      "@type": "Offer",
      price: bag.price.replace("€/mes", ""),
      priceCurrency: "EUR",
      availability:
        bag.availability.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://semzoprive.com/catalog/${canonicalPath}`,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      seller: {
        "@type": "Organization",
        name: "Semzo Prive",
        url: "https://semzoprive.com",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: bag.rating,
      reviewCount: bag.reviews,
    },
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <nav aria-label="Ruta de navegacion" className="container mx-auto px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          <li>
            <Link href="/" className="hover:text-indigo-dark hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">
            /
          </li>
          <li>
            <Link href="/catalog" className="hover:text-indigo-dark hover:underline">
              Catalogo
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">
            /
          </li>
          <li>
            <span className="text-slate-500">{bag.brand}</span>
          </li>
          <li aria-hidden="true" className="text-slate-300">
            /
          </li>
          <li className="text-slate-700 font-medium" aria-current="page">
            {bag.name}
          </li>
        </ol>
      </nav>
      <BagDetail bag={bag} relatedBags={relatedBags} />
    </main>
  )
}
