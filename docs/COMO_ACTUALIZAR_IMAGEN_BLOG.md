# Cómo Actualizar Imagen de un Artículo del Blog

## Opción 1: Usando el Endpoint API (Recomendado)

Puedes actualizar la imagen de un artículo existente haciendo una petición al endpoint:

\`\`\`bash
POST /api/blog/update-image
Content-Type: application/json

{
  "slug": "cinco-marcas-lujo-2024",
  "imageUrl": "/images/jacquemus.png"
}
\`\`\`

### Usando curl:

\`\`\`bash
curl -X POST https://semzoprive.com/api/blog/update-image \
  -H "Content-Type: application/json" \
  -d '{"slug":"cinco-marcas-lujo-2024","imageUrl":"URL_DE_TU_IMAGEN"}'
\`\`\`

## Opción 2: Desde el Panel de Admin

1. Ve a `/admin/blog`
2. Encuentra el artículo "Las Cinco Marcas de Lujo que más se Alquilaron en 2024"
3. Haz clic en "Ver" para ver el artículo
4. Descarga el archivo markdown
5. Edita la línea `image:` en el frontmatter
6. Vuelve a subir el archivo en la pestaña "Subir Markdown"

## Opción 3: Manualmente en Vercel Blob

1. Ve a tu dashboard de Vercel
2. Selecciona tu proyecto
3. Ve a la sección "Storage" > "Blob"
4. Busca el archivo `blog/cinco-marcas-lujo-2024.md` (o el slug correspondiente)
5. Descarga el archivo
6. Edita la línea del frontmatter:
   \`\`\`yaml
   image: "https://tu-nueva-url-de-imagen.com/imagen.png"
   \`\`\`
7. Vuelve a subir el archivo con el mismo nombre

## Estructura del Frontmatter

\`\`\`yaml
---
title: "Las Cinco Marcas de Lujo que más se Alquilaron en 2024"
date: "2024-05-28"
author: "Semzo Privé"
excerpt: "El auge del alquiler de lujo ha dejado claro algo importante..."
image: "AQUI_VA_TU_NUEVA_URL"
slug: "cinco-marcas-lujo-2024"
---
\`\`\`

## Tamaños Recomendados de Imagen

- **Tamaño óptimo**: 800 x 1000 px (proporción 4:5)
- **Formato**: JPG o WebP
- **Peso máximo**: 300-500 KB
