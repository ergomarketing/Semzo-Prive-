import { notFound } from "next/navigation"
import BlogContent from "./BlogContent"
import type { Metadata } from "next"

// ISR optimizado
export const revalidate = 300

interface PageProps {
  params: { slug: string }
}

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
  updatedAt?: string
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/api/blog?slug=${slug}`,
      {
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: "Artículo no encontrado | SEMZO Magazine",
      description: "El artículo que buscas no está disponible.",
      robots: { index: false, follow: false },
    }
  }

  const url = `https://semzoprive.com/blog/${slug}`
  const excerpt = post.excerpt?.substring(0, 155) || post.title
  const imageUrl =
    post.image || "https://semzoprive.com/images/hero-luxury-bags.jpeg"

  return {
    title: `${post.title} | SEMZO Magazine`,
    description: excerpt,

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },

    openGraph: {
      type: "article",
      locale: "es_ES",
      url,
      siteName: "Semzo Privé",
      title: post.title,
      description: excerpt,
      publishedTime: post.date,
      modifiedTime: post.updatedAt || post.date,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: excerpt,
      images: [imageUrl],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = params
  const post = await getPost(slug)

  if (!post) {
    notFound() // 🔥 Corrige Soft 404 real
  }

  const url = `https://semzoprive.com/blog/${slug}`

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.image || "https://semzoprive.com/images/hero-luxury-bags.jpeg",
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    inLanguage: "es-ES",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: {
      "@type": "Organization",
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
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingSchema),
        }}
      />
      <BlogContent post={post} slug={slug} />
    </>
  )
}
