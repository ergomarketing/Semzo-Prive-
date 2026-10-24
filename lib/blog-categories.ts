/**
 * Secciones del blog. El valor guardado en blog_posts.category es el slug;
 * la URL publica de cada seccion es /blog/seccion/<slug>.
 */
export interface BlogCategory {
  slug: string
  label: string
  description: string
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "maisons-e-iconos",
    label: "Maisons e iconos",
    description:
      "Las casas, los creadores y los bolsos que escribieron la historia del lujo: Chanel, Lagerfeld, Valentino y más.",
  },
  {
    slug: "tendencias",
    label: "Tendencias",
    description:
      "Los bolsos y las marcas que marcan el año, y cómo llevarlos sin comprarlos.",
  },
  {
    slug: "guias",
    label: "Guías",
    description:
      "Consejos prácticos: qué bolso elegir según la ocasión, cómo cuidarlo y cómo leer su valor.",
  },
  {
    slug: "lujo-consciente",
    label: "Lujo consciente",
    description:
      "Acceder en lugar de acumular: el lujo lento, la segunda mano y el alquiler como nueva forma de vivir el lujo.",
  },
]

export function getBlogCategory(slug?: string | null): BlogCategory | null {
  if (!slug) return null
  return BLOG_CATEGORIES.find((c) => c.slug === slug) ?? null
}
