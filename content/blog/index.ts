export const blogPosts: Record<string, string> = {
  "como-alquilar-bolsos-lujo": `
# Cómo alquilar bolsos de lujo en Semzo Privé

Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.

## ¿Cómo funciona?

1. Elige tu membresía.
2. Selecciona tu bolso favorito.
3. Recíbelo en casa con envío asegurado.
4. Cámbialo cuando quieras.

## Ventajas

- Seguro incluido
- Envío gratuito
- Cambios ilimitados
- Acceso a piezas icónicas

Explora nuestro catálogo y transforma tu estilo.
  `,

  "por-que-alquilar-bolsos-es-inteligente": `
# Por qué alquilar bolsos de lujo es una decisión inteligente

El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.

## Beneficios clave

- Rotación de estilo
- Acceso a marcas exclusivas
- Consumo consciente
- Optimización financiera

Semzo Privé redefine el lujo accesible.
  `,
}

export function getAllBlogSlugs() {
  return Object.keys(blogPosts)
}

export function getBlogPostContent(slug: string): string | null {
  return blogPosts[slug] || null
}
