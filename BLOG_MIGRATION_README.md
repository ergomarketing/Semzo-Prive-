# Blog Storage Migration - FASE A Completada

## Estado Actual

El blog ha sido migrado exitosamente de **Vercel Blob Storage** a **Filesystem** (`/content/blog/`).

## Feature Flag: USE_BLOB

El sistema ahora soporta ambos métodos de almacenamiento mediante una variable de entorno:

\`\`\`bash
USE_BLOB=false  # Usa filesystem (ACTUAL - Recomendado)
USE_BLOB=true   # Usa Vercel Blob Storage
\`\`\`

### Configuración Actual

Por defecto, el sistema usa **filesystem** (`USE_BLOB=false` o no definida).

## Estructura de Archivos

\`\`\`
/content/blog/
├── historia-del-birkin.md
├── cuidado-bolsos-lujo.md
└── lujo-sostenible.md
\`\`\`

## Archivos Modificados

### Core Library
- `/lib/blog-storage.ts` - Nueva abstracción unificada para storage

### API Routes
- `/app/api/blog/route.ts` - GET, POST, DELETE
- `/app/api/blog/edit/route.ts` - POST (editar posts)
- `/app/api/blog/update-date/route.ts` - POST (actualizar fecha)
- `/app/api/blog/update-image/route.ts` - POST (actualizar imagen)

### Content
- `/content/blog/*.md` - Posts de ejemplo migrados

## Cómo Funciona

### Filesystem Mode (Actual)
1. Los posts se almacenan en `/content/blog/` como archivos `.md`
2. El sistema lee directamente del filesystem usando Node.js `fs` API
3. Los posts se cachean durante 7 días (ISR)
4. No hay costos de Blob Storage
5. Requiere redeploy para nuevos posts

### Blob Storage Mode
1. Los posts se almacenan en Vercel Blob
2. El sistema usa `@vercel/blob` SDK
3. Los posts son accesibles via CDN
4. Permite subida dinámica sin redeploy
5. Sujeto a límites de Blob Storage

## Ventajas del Filesystem

✅ **Sin costos adicionales** - No usa Blob Storage
✅ **Sin límites** - No hay restricciones de almacenamiento
✅ **Más rápido en dev** - No requiere conexión a Blob
✅ **Control total** - Posts en el repositorio
✅ **Mejor para SEO** - ISR estático optimizado

## Posts de Ejemplo Incluidos

1. **historia-del-birkin.md**
   - Historia del icónico bolso Hermès Birkin
   - Artesanía, materiales, inversión

2. **cuidado-bolsos-lujo.md**
   - Guía completa de mantenimiento
   - Limpieza, almacenamiento, restauración

3. **lujo-sostenible.md**
   - Futuro del lujo pre-amado
   - Sostenibilidad y consumo consciente

## Cómo Agregar Nuevos Posts

### Opción 1: Manualmente
1. Crear archivo `.md` en `/content/blog/`
2. Agregar frontmatter:
\`\`\`yaml
---
title: "Tu Título"
date: "2024-02-10"
author: "Semzo Privé"
excerpt: "Breve descripción..."
slug: "tu-slug"
image: "/ruta/a/imagen.jpg"
---

Contenido del post aquí...
\`\`\`
3. Hacer commit y deploy

### Opción 2: Admin Panel
1. Ir a `/admin/blog`
2. Usar el formulario de creación
3. El sistema creará automáticamente el archivo

## Migración Futura a Blob (FASE B)

Si decides volver a Blob Storage cuando se reactive:

1. Configurar `USE_BLOB=true` en variables de entorno
2. Subir los archivos de `/content/blog/` a Blob
3. El sistema automáticamente usará Blob

No requiere cambios de código adicionales.

## Cache e ISR

- **GET requests**: Cache de 7 días (604800 segundos)
- **Razón**: Posts publicados 1-2 veces por semana
- **Headers**: `s-maxage=604800, stale-while-revalidate=86400`

## Troubleshooting

### "Post not found"
- Verificar que el archivo `.md` existe en `/content/blog/`
- Verificar que el slug coincide con el nombre del archivo
- Revisar permisos de lectura

### "Error reading blog directory"
- La carpeta `/content/blog/` debe existir
- Verificar permisos del filesystem en deployment

### Imágenes no cargan
- Asegurarse de que las rutas de imagen son correctas
- Usar rutas absolutas (`/images/...`) o URLs completas
- Verificar que las imágenes existen en `/public/images/`

## Testing

### Local Development
\`\`\`bash
npm run dev
# El sistema usa filesystem automáticamente
\`\`\`

### Production
\`\`\`bash
# Build y deploy
vercel deploy --prod
\`\`\`

## Next Steps

- [ ] Migrar posts existentes de Blob a filesystem (si hay más)
- [ ] Actualizar imágenes del blog si es necesario
- [ ] Testear admin panel de creación de posts
- [ ] Considerar añadir más posts de contenido
- [ ] Optimizar imágenes para mejor performance

## Contacto

Si tienes preguntas sobre esta migración, revisa:
- `/lib/blog-storage.ts` - Implementación core
- Este README
- Logs del servidor con `[v0]` prefix
