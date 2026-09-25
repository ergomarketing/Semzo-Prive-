import type { Metadata } from "next"
import ClientHomePage from "./client-page"
import { createClient } from "@supabase/supabase-js"
import type { PublicReview } from "./components/verified-reviews-section"

// ISR: Revalidate every 10 minutes (600 seconds) - reduces function invocations
export const revalidate = 600
// La home DEBE seguir siendo estatica (ISR). Cuando leia las reseñas con el cliente
// de Supabase basado en cookies (cookies() => APIs dinamicas) paso a renderizarse en
// cada visita: cache-control private/no-store, x-vercel-cache MISS, y el <footer> del
// layout se pintaba arriba mientras esperaba la BD y luego saltaba (CLS = 1,0 en
// PageSpeed). force-static lo garantiza: si alguien vuelve a usar cookies()/headers()
// aqui, devolveran vacio en vez de volver a hacer dinamica la portada.
export const dynamic = "force-static"

// `title.absolute` evita que se aplique el template "%s | Semzo Privé" del
// layout (el title ya termina en "SEMZO PRIVÉ").
const HOME_TITLE =
  "Alquiler de Bolsos de Lujo en España | Chanel, Louis Vuitton, Dior | SEMZO PRIVÉ"
const HOME_DESCRIPTION =
  "Accede a bolsos Chanel, Louis Vuitton, Dior, Prada y Loewe desde 59,99€/mes. Club privado de membresía. Envío gratuito en 24h. Sin permanencia."

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "https://semzoprive.com",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "https://semzoprive.com",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/hero-luxury-bags.jpeg",
        width: 1200,
        height: 630,
        alt: "Semzo Privé - Club de bolsos de diseñador",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

// Reseñas verificadas: datos publicos (rating>7 y consentimiento explicito), no dependen
// de la sesion de la visitante -> cliente anonimo SIN cookies. Cualquier fallo deja la
// portada sin la seccion en vez de romperla.
async function getVerifiedReviews(): Promise<PublicReview[]> {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data } = await supabase
      .from("public_reviews")
      .select("id, rating, comment, display_name, last_initial, bag_name, bag_brand")
      .order("created_at", { ascending: false })
      .limit(6)
    return (data as PublicReview[] | null) ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const verifiedReviews = await getVerifiedReviews()

  return <ClientHomePage verifiedReviews={verifiedReviews} />
}
