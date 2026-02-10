# Guía de URLs SEO-friendly

## Estructura de URLs Implementada

### Páginas Estáticas
✅ **URLs correctas (todas en español):**
- `/` - Homepage
- `/proceso` - Cómo funciona
- `/blog` - Listado de blog
- `/membership/upgrade` - Actualizar membresía
- `/membership/upgrade/essentiel` - Plan Essentiel
- `/membership/upgrade/signature` - Plan Signature
- `/membership/upgrade/prive` - Plan Privé
- `/legal/terms` - Términos y condiciones
- `/legal/privacy` - Política de privacidad
- `/legal/cookies` - Política de cookies

### URLs Dinámicas

#### Blog Posts
✅ **Estructura correcta:** `/blog/{slug-descriptivo}`

Ejemplos:
- `/blog/como-elegir-bolso-lujo`
- `/blog/tendencias-moda-2025`

#### Productos del Catálogo
⚠️ **Actual:** `/catalog/{id}` (ejemplo: `/catalog/123`)

🎯 **Recomendación futura:** `/catalog/{marca-modelo-id}`

Ejemplos recomendados:
- `/catalog/louis-vuitton-neverfull-mm-123`
- `/catalog/hermes-birkin-35-456`
- `/catalog/chanel-classic-flap-789`

**Ventajas:**
- URLs descriptivas mejoran CTR en resultados de búsqueda
- Google indexa mejor contenido con keywords en URL
- Mejor experiencia de usuario (entienden qué van a ver)
- Mantiene ID al final para garantizar unicidad

## Reglas de URLs

### 1. Idioma Consistente
- Todas las URLs públicas en **español**
- Dashboard y áreas privadas pueden usar inglés

### 2. Estructura Jerárquica Clara
\`\`\`
✅ Correcto:
/membership/upgrade/signature
/legal/privacy

❌ Incorrecto:
/signature-membership
/privacy-policy
\`\`\`

### 3. Sin Parámetros de Query Visibles
\`\`\`
✅ Correcto: /blog/tendencias-moda-2025
❌ Incorrecto: /blog?id=123
\`\`\`

### 4. Lowercase y Guiones
\`\`\`
✅ Correcto: /como-elegir-bolso
❌ Incorrecto: /Como_Elegir_Bolso
\`\`\`

### 5. Sin Trailing Slashes
\`\`\`
✅ Correcto: /proceso
❌ Incorrecto: /proceso/
\`\`\`

## Redirecciones Implementadas

El middleware (`proxy.ts`) gestiona:
- Rutas protegidas (requieren autenticación)
- Rutas públicas (accesibles sin login)
- Redirección de usuarios autenticados desde /auth a /dashboard

## Utilidades Disponibles

Ver `utils/url-helpers.ts` para funciones de generación de slugs:
- `slugify()` - Convierte texto a slug
- `generateProductSlug()` - Genera slug de producto
- `extractProductId()` - Extrae ID de slug
- `normalizeUrl()` - Normaliza URLs

## Implementación Futura

Para migrar productos a URLs SEO-friendly:

1. Agregar columna `slug` a tabla `bags` en Supabase
2. Crear función que genere slugs únicos
3. Cambiar ruta de `/catalog/[id]` a `/catalog/[slug]`
4. Agregar redirecciones 301 de URLs antiguas a nuevas
5. Actualizar sitemap.xml con nuevas URLs

**Nota:** Mantener compatibilidad con URLs antiguas mediante redirecciones.
