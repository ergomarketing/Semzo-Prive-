export const blogPosts: Record<string, string> = {
  "como-alquilar-bolsos-lujo": `---
slug: como-alquilar-bolsos-lujo
title: Cómo alquilar bolsos de lujo en Semzo Privé
date: 2026-03-01
author: Semzo Privé
excerpt: Descubre cómo acceder a bolsos de lujo como Chanel, Dior y Louis Vuitton mediante nuestro sistema de suscripción mensual.
image: /images/hero-luxury-bags.jpg
---

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

  "por-que-alquilar-bolsos-es-inteligente": `---
slug: por-que-alquilar-bolsos-es-inteligente
title: Por qué alquilar bolsos de lujo es una decisión inteligente
date: 2026-03-05
author: Semzo Privé
excerpt: El alquiler de bolsos premium permite acceder a piezas icónicas sin realizar una inversión inicial elevada.
image: /images/lista-privada-bg.jpg
---

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
