import type { Metadata } from "next"

import { BlogIndex } from "./blog-index"

export const dynamic = "force-dynamic"

// title.absolute: el titulo ya termina en "SEMZO PRIVÉ", evitamos el template
// "%s | Semzo Privé" del layout.
const BLOG_TITLE =
  "Luxury Intelligence | Moda, Lujo Consciente y Tendencias | SEMZO PRIVÉ"
const BLOG_DESCRIPTION =
  "Artículos sobre lujo slow, inversión en bolsos de diseñador y tendencias de moda. La revista editorial de SEMZO PRIVÉ."

export const metadata: Metadata = {
  title: {
    absolute: BLOG_TITLE,
  },
  description: BLOG_DESCRIPTION,
  alternates: {
    canonical: "https://semzoprive.com/blog",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: "https://semzoprive.com/blog",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/fendi-beige-hero.jpeg",
        width: 1200,
        height: 630,
        alt: "SEMZO Magazine - Blog de lujo consciente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    images: ["https://semzoprive.com/images/fendi-beige-hero.jpeg"],
  },
}

export default function BlogPage() {
  return <BlogIndex />
}
