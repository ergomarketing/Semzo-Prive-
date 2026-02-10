# Optimización de Imágenes para SEO

## Estado Actual

### Optimizaciones Implementadas ✅

1. **Next.js Image Component**
   - Todos los componentes usan `<Image>` de `next/image`
   - Formatos modernos (WebP, AVIF) habilitados en `next.config.mjs`
   - Lazy loading automático para imágenes no críticas

2. **Atributos Alt Descriptivos**
   - Hero: "Bolsos de lujo de diseñador"
   - Productos: Incluyen marca y nombre del bolso
   - Blog: Usa título del artículo

3. **Priority Loading**
   - Imágenes hero tienen `priority={true}`
   - Imágenes above-the-fold cargadas inmediatamente

4. **Responsive Images**
   - Configuración de `deviceSizes` y `imageSizes` en next.config.mjs
   - Atributo `sizes` para diferentes viewports

### Configuración en next.config.mjs

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-storage-domain.com',
    },
  ],
}
```

## Mejores Prácticas

### 1. Atributos Alt Text

**Buenas prácticas:**
- Ser descriptivo y específico
- Incluir marca, modelo y características relevantes
- NO usar "imagen de..." o "foto de..."
- Máximo 125 caracteres

**Ejemplos:**

```tsx
// ❌ Malo
<Image src="/bag.jpg" alt="bolso" />

// ✅ Bueno
<Image src="/bag.jpg" alt="Hermès Birkin 35cm en cuero Togo negro con herrajes dorados" />

// ✅ Para hero
<Image src="/hero.jpg" alt="Colección de bolsos de lujo Chanel, Hermès y Louis Vuitton" />

// ✅ Para decorativas (raro)
<Image src="/pattern.jpg" alt="" role="presentation" />
```

### 2. Dimensiones Explícitas

Siempre especifica `width` y `height` para evitar CLS (Cumulative Layout Shift):

```tsx
// ✅ Bueno - previene CLS
<Image 
  src="/product.jpg" 
  alt="Chanel Classic Flap Medium"
  width={800}
  height={800}
  className="object-contain"
/>

// ✅ Para fill
<div className="relative aspect-square">
  <Image 
    src="/hero.jpg" 
    alt="Hero background"
    fill
    className="object-cover"
  />
</div>
```

### 3. Priority Loading

Usa `priority` solo para imágenes críticas (above-the-fold):

```tsx
// ✅ Hero image - visible inmediatamente
<Image src="/hero.jpg" alt="Hero" priority />

// ✅ Imágenes del catálogo - lazy loading
<Image src="/product.jpg" alt="Producto" loading="lazy" />
```

### 4. Sizes Attribute

Optimiza el tamaño de la imagen según el viewport:

```tsx
<Image
  src="/product.jpg"
  alt="Producto"
  width={800}
  height={800}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 5. Quality

- Default: 75 (bueno para la mayoría)
- Hero/Marketing: 85-90
- Thumbnails: 60-75

```tsx
<Image src="/hero.jpg" alt="Hero" quality={85} />
```

## Checklist de Auditoría

Antes de publicar nuevas imágenes, verifica:

- [ ] Usa `next/image` en lugar de `<img>`
- [ ] Alt text descriptivo y específico (no genérico)
- [ ] Width y height especificados (o usa `fill` con contenedor definido)
- [ ] `priority={true}` solo en imágenes above-the-fold
- [ ] `sizes` attribute para imágenes responsive
- [ ] Quality apropiado (85 para hero, 75 para contenido)
- [ ] Formato WebP/AVIF disponible (automático con next/image)

## Impacto SEO

### Core Web Vitals Afectados:

1. **LCP (Largest Contentful Paint)**
   - Imágenes hero optimizadas con `priority`
   - Formatos modernos reducen tiempo de carga

2. **CLS (Cumulative Layout Shift)**
   - Dimensiones explícitas previenen shifts
   - Aspect ratio definido

3. **FID/INP (Interactividad)**
   - Lazy loading reduce carga inicial
   - Imágenes no bloquean JavaScript

## Herramientas de Verificación

1. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/

2. **WebPageTest**
   - https://www.webpagetest.org/

3. **Chrome DevTools**
   - Lighthouse audit
   - Network tab para verificar formatos WebP/AVIF

## Mantenimiento

**Revisión mensual:**
- Auditar nuevas imágenes agregadas
- Verificar Core Web Vitals en Google Search Console
- Optimizar imágenes pesadas (>200KB)
- Actualizar alt texts según contenido

**Automatización:**
- CI/CD: verificar que todas las imágenes usen next/image
- Comprimir imágenes antes de subirlas (TinyPNG, ImageOptim)
- Generar múltiples tamaños en el servidor
