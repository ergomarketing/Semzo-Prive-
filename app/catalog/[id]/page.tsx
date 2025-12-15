import type { Metadata } from "next"
import Navbar from "../../components/navbar"
import Footer from "../../components/footer"
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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data } = await supabase.from("bags").select("*").eq("id", id).single()

      if (data) {
        const bagName = `${data.brand} ${data.name}`
        const price =
          data.price || (data.membership_type === "prive" ? 189 : data.membership_type === "signature" ? 129 : 59)

        return {
          title: `${bagName} - Alquiler desde ${price}€/mes`,
          description:
            data.description ||
            `Alquila el bolso ${bagName} por solo ${price}€/mes. Incluye envío gratis, seguro y cambios ilimitados. Disponible en Semzo Privé.`,
          keywords: [data.brand, data.name, "alquiler", "bolso lujo", data.membership_type],
          openGraph: {
            title: `${bagName} | Semzo Privé`,
            description: `Alquila este elegante ${bagName} desde ${price}€/mes con envío gratis y seguro incluido.`,
            images: [data.images?.[0] || data.image_url || "/images/hero-luxury-bags.jpeg"],
            url: `https://semzoprive.com/catalog/${id}`,
          },
          twitter: {
            card: "summary_large_image",
            title: `${bagName} - Alquiler ${price}€/mes`,
            description: `Alquila este ${bagName} con Semzo Privé. Envío gratis y seguro incluido.`,
            images: [data.images?.[0] || data.image_url],
          },
          alternates: {
            canonical: `https://semzoprive.com/catalog/${id}`,
          },
        }
      }
    } catch (error) {
      console.error("Error generating metadata:", error)
    }
  }

  return {
    title: "Bolso de Lujo",
    description: "Descubre este elegante bolso de lujo disponible para alquiler en Semzo Privé.",
  }
}

export default async function BagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let bag = null
  let relatedBags: any[] = []

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data, error: fetchError } = await supabase.from("bags").select("*").eq("id", id).single()

      if (fetchError) {
        console.error("[v0] Error fetching bag:", fetchError.message)
      } else if (data) {
        bag = {
          id: data.id,
          name: data.name,
          brand: data.brand,
          description:
            data.description ||
            `Elegante bolso ${data.brand} ${data.name}. Un diseño exclusivo que combina lujo y funcionalidad.`,
          price: `${data.price}€/mes`,
          retailPrice: `${data.retail_price}€`,
          images: data.images || [data.image_url, data.image_url, data.image_url],
          membership: data.membership_type || "essentiel",
          color: data.color || "Clásico",
          material: data.material || "Cuero premium",
          dimensions: data.dimensions || "Medidas estándar",
          condition: data.condition || "Excelente",
          year: data.year || "2023",
          availability: {
            status: data.status === "available" ? ("available" as const) : ("rented" as const),
          },
          rating: data.rating || 4.8,
          reviews: data.reviews || 50,
          features: data.features || [
            "Diseño icónico y atemporal",
            "Materiales de la más alta calidad",
            "Perfecto para ocasiones especiales",
            "Compartimentos organizados",
            "Herrajes premium",
          ],
          careInstructions: data.care_instructions || [
            "Evitar el contacto con agua y humedad excesiva",
            "Guardar en lugar seco y ventilado",
            "Limpiar con paño suave y seco",
            "Evitar exposición directa al sol",
          ],
        }

        const { data: relatedData } = await supabase
          .from("bags")
          .select("id, name, brand, price, image_url, images, membership_type")
          .neq("id", id)
          .eq("status", "available")
          .limit(3)

        if (relatedData) {
          relatedBags = relatedData.map((item) => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            price: item.price
              ? `${item.price}€/mes`
              : item.membership_type === "prive"
                ? "189€/mes"
                : item.membership_type === "signature"
                  ? "129€/mes"
                  : "59€/mes",
            image: item.images?.[0] || item.image_url || "/placeholder.svg",
            membership: item.membership_type || "essentiel",
          }))
        }
      }
    } catch (err) {
      console.error("[v0] Supabase connection error:", err)
    }
  } else {
    console.error("[v0] Missing Supabase credentials - URL:", !!supabaseUrl, "Key:", !!supabaseKey)
  }

  if (!bag) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-serif text-slate-900 mb-4">Bolso no encontrado</h1>
            <p className="text-slate-600 mb-8">El bolso que buscas no existe o ha sido removido.</p>
            <Link href="/catalog" className="inline-flex items-center text-indigo-dark hover:underline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Catálogo
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${bag.brand} ${bag.name}`,
    brand: {
      "@type": "Brand",
      name: bag.brand,
    },
    description: bag.description,
    image: bag.images,
    offers: {
      "@type": "Offer",
      price: bag.price.replace("€/mes", ""),
      priceCurrency: "EUR",
      availability:
        bag.availability.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://semzoprive.com/catalog/${bag.id}`,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: bag.rating,
      reviewCount: bag.reviews,
    },
  }

  return (
    <>
      <Navbar />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
        <BagDetail bag={bag} relatedBags={relatedBags} />
      </main>
      <Footer />
    </>
  )
}
