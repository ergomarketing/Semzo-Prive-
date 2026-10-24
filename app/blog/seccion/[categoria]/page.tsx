import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlogIndex } from "../../blog-index"
import { BLOG_CATEGORIES, getBlogCategory } from "@/lib/blog-categories"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ categoria: string }> }

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ categoria: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria } = await params
  const category = getBlogCategory(categoria)
  if (!category) notFound()

  const title = `${category.label} | Luxury Intelligence | SEMZO PRIVÉ`
  const url = `https://semzoprive.com/blog/seccion/${category.slug}`
  return {
    title: { absolute: title },
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_ES",
      title,
      description: category.description,
      url,
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
  }
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { categoria } = await params
  if (!getBlogCategory(categoria)) notFound()
  return <BlogIndex categorySlug={categoria} />
}
