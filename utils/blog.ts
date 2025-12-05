export interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
}

// Default posts when no posts exist in blob storage
export const defaultPosts: BlogPost[] = [
  {
    slug: "historia-secreta-birkin-hermes",
    title: "La Historia Secreta del Birkin de Hermès",
    date: "2025-12-01",
    author: "Semzo Privé",
    excerpt:
      "Descubre los orígenes de uno de los bolsos más codiciados del mundo y por qué su lista de espera puede durar años.",
    image: "/images/hermes-birkin-bag-iconic.jpg",
    content: `El Birkin de Hermès es mucho más que un bolso: es un símbolo de estatus, artesanía y exclusividad. Pero, ¿cómo nació este icono de la moda?

## El Encuentro que Cambió Todo

En 1984, Jane Birkin, la actriz y cantante británica, se encontraba en un vuelo de París a Londres sentada junto a Jean-Louis Dumas, entonces director ejecutivo de Hermès. Durante el vuelo, el contenido de su bolso de mimbre cayó al suelo. Birkin comentó lo difícil que era encontrar un bolso de fin de semana que le gustara.

## El Nacimiento de un Ícono

Dumas tomó nota de sus necesidades: un bolso espacioso pero elegante, práctico pero lujoso. Así nació el Birkin, un diseño que combina funcionalidad con el más alto nivel de artesanía francesa.

## La Artesanía Detrás del Bolso

Cada Birkin es confeccionado a mano por un solo artesano, un proceso que puede tomar hasta 48 horas de trabajo meticuloso. Los materiales van desde el cuero de becerro Togo hasta pieles exóticas como cocodrilo y avestruz.

## La Lista de Espera Legendaria

La demanda del Birkin supera con creces la oferta, creando listas de espera que pueden extenderse por años. Esta escasez artificial ha convertido al bolso en una inversión, con algunos modelos apreciándose más que el oro o el mercado de valores.

## El Birkin Hoy

Hoy, el Birkin sigue siendo el bolso más codiciado del mundo. En Semzo Privé, te ofrecemos la oportunidad de experimentar este ícono sin la lista de espera tradicional.`,
  },
  {
    slug: "cuidado-bolsos-lujo",
    title: "Guía Completa para el Cuidado de Bolsos de Lujo",
    date: "2025-11-28",
    author: "Semzo Privé",
    excerpt: "Aprende los secretos de los expertos para mantener tus bolsos de diseñador en perfectas condiciones.",
    image: "/images/luxury-bag-care-maintenance.jpg",
    content: `Mantener un bolso de lujo en perfectas condiciones requiere conocimiento y dedicación. Aquí te compartimos los secretos de nuestros expertos.

## Almacenamiento Correcto

El almacenamiento es crucial para preservar la forma y el material de tu bolso:

- **Relleno**: Siempre guarda tu bolso con papel de seda sin ácido en el interior
- **Dust bag**: Utiliza siempre la bolsa de tela original
- **Posición**: Guárdalo de pie, nunca acostado
- **Espacio**: Evita amontonar bolsos, cada uno necesita su espacio

## Limpieza Regular

La limpieza preventiva es mejor que la correctiva:

- Limpia suavemente con un paño de microfibra después de cada uso
- Para cuero, usa productos específicos recomendados por la marca
- Nunca uses productos químicos agresivos

## Protección del Cuero

El cuero necesita hidratación regular:

- Aplica acondicionador de cuero cada 3-6 meses
- Evita la exposición directa al sol
- Protege de la lluvia con sprays impermeabilizantes específicos

## Manejo de Manchas

Actúa rápido ante cualquier mancha:

- Seca inmediatamente cualquier líquido con papel absorbente
- No frotes, da toques suaves
- Consulta a un profesional para manchas difíciles

## Servicio Profesional

En Semzo Privé, todos nuestros bolsos pasan por un proceso de limpieza y acondicionamiento profesional entre cada préstamo, garantizando que siempre recibas piezas en condiciones impecables.`,
  },
  {
    slug: "tendencias-primavera-2025",
    title: "Tendencias en Bolsos para Primavera 2025",
    date: "2025-11-25",
    author: "Semzo Privé",
    excerpt: "Las pasarelas han hablado: descubre qué bolsos dominarán la próxima temporada.",
    image: "/images/spring-fashion-handbags-2025.jpg",
    content: `La primavera 2025 promete una explosión de creatividad en el mundo de los bolsos de lujo. Estas son las tendencias que definirán la temporada.

## El Regreso del Color

Después de temporadas dominadas por neutros, los colores vibrantes vuelven con fuerza:

- **Verde esmeralda**: El color estrella de la temporada
- **Rosa shocking**: Inspirado en el legado de Schiaparelli
- **Amarillo sol**: Para los más atrevidos

## Minimalismo Estructurado

Las formas geométricas y líneas limpias dominan las colecciones:

- Bolsos tipo caja con acabados impecables
- Siluetas arquitectónicas
- Hardware minimalista pero impactante

## El Tamaño Importa

La tendencia micro bolso cede terreno:

- Regreso de los bolsos de tamaño mediano
- Totes estructurados para el día a día
- Hobo bags relajados pero elegantes

## Materiales Innovadores

La sostenibilidad impulsa la innovación:

- Cueros de origen responsable
- Alternativas veganas de alta calidad
- Tejidos artesanales recuperados

## Nuestras Recomendaciones

En Semzo Privé hemos actualizado nuestra colección con las piezas más codiciadas de la temporada. Desde el nuevo Puzzle de Loewe hasta las últimas creaciones de Bottega Veneta, tenemos todo lo que necesitas para estar a la vanguardia.`,
  },
]

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/blog`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return defaultPosts
    }

    const posts = await response.json()
    return posts.length > 0 ? posts : defaultPosts
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return defaultPosts
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/blog?slug=${slug}`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return defaultPosts.find((p) => p.slug === slug) || null
    }

    const post = await response.json()
    return post || defaultPosts.find((p) => p.slug === slug) || null
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return defaultPosts.find((p) => p.slug === slug) || null
  }
}
