import { notFound } from "next/navigation"
import BlogContent from "./BlogContent"
import type { Metadata } from "next"

// ISR: Revalidate every 5 minutes (300 seconds) - reduces function invocations
export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
  updatedAt?: string // Agregado campo opcional updatedAt
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/api/blog?slug=${slug}`,
      {
        cache: "no-store",
      },
    )

    if (!response.ok) {
      console.error("[v0] Failed to fetch blog post:", response.status)
      return null
    }

    const post = await response.json()
    console.log("[v0] Blog post loaded:", slug, post ? "found" : "not found")
    return post
  } catch (error) {
    console.error("[v0] Error fetching blog post:", error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: "Artículo no encontrado | SEMZO Magazine",
      description: "El artículo que buscas no está disponible.",
    }
  }

  const excerpt = post.excerpt?.substring(0, 160) || post.title
  const imageUrl = post.image || "https://semzoprive.com/images/fendi-beige-hero.jpeg"

  return {
    title: `${post.title} | SEMZO Magazine`,
    description: excerpt,
    alternates: {
      canonical: `https://semzoprive.com/blog/${slug}`,
    },
    openGraph: {
      type: "article",
      locale: "es_ES",
      title: `${post.title} | SEMZO Magazine`,
      description: excerpt,
      url: `https://semzoprive.com/blog/${slug}`,
      siteName: "Semzo Privé",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.date,
      modifiedTime: post.updatedAt || post.date,
      authors: ["Semzo Privé"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | SEMZO Magazine`,
      description: excerpt,
      images: [imageUrl],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.image || "https://semzoprive.com/images/hero-luxury-bags.jpeg",
    datePublished: post.date,
    dateModified: post.updatedAt || post.date, // Usa updatedAt si existe
    inLanguage: "es-ES", // Agregado idioma español
    author: {
      "@type": "Organization", // Cambiado de Person a Organization
      name: "Semzo Privé",
    },
    publisher: {
      "@type": "Organization",
      name: "Semzo Privé",
      logo: {
        "@type": "ImageObject",
        url: "https://semzoprive.com/images/semzo-prive-logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://semzoprive.com/blog/${slug}`,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      <BlogContent post={post} slug={slug} />
    </>
  )
}
