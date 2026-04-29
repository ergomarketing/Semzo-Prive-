# Auditoria SEO Semzo Prive - Plan de accion 2026-04-29

Auditoria completa: tecnico + on-page + rendimiento. Sin tocar codigo, solo diagnostico.

---

## RESUMEN EJECUTIVO

| Severidad | Hallazgos | Estado |
|-----------|-----------|--------|
| Critico   | 3         | Pendiente |
| Medio     | 4         | Pendiente |
| Bajo      | 3         | Pendiente |

Trabajo SEO previo: solido (ver `INFORME_AUDITORIA_SEO_COMPLETA.md`). Hay schemas, metadata, sitemap dinamico y robots configurados. Esta auditoria detecta inconsistencias y oportunidades NO cubiertas en esa primera fase.

---

## CRITICOS (afectan indexacion)

### C1. Conflicto de sitemaps - Google esta leyendo el viejo

**Archivos:**
- `/public/sitemap.xml` (estatico, fechas Diciembre 2025, sin productos ni blog)
- `/app/sitemap.ts` (dinamico, con productos, blog, paginas dinamicas)

**Problema:**
En Next.js, cuando existe un archivo en `/public` con el mismo nombre que una ruta generada (`/sitemap.xml`), **el estatico tiene prioridad**. Google esta indexando el sitemap de Diciembre 2025 que NO incluye:
- Catalogo de productos
- Articulos del blog
- Calculadora de ahorro
- Lista privada
- Recomendaciones

**Impacto:** Google no descubre las URLs nuevas. Las paginas no se indexan o tardan mucho.

**Fix propuesto:**
- Borrar `/public/sitemap.xml`
- Verificar que `app/sitemap.ts` cubre TODAS las rutas indexables.
- Re-enviar sitemap en Google Search Console.

---

### C2. Verification de Google Search Console mal configurado

**Archivo:** `app/layout.tsx`

**Problema:**
```ts
verification: {
  google: "G-0BMNYQLWLZ"  // <-- esto es Measurement ID de GA4, NO codigo GSC
}
```

El valor `G-0BMNYQLWLZ` es el ID de Google Analytics 4. El campo `verification.google` espera el codigo del meta tag de Search Console (formato: cadena alfanumerica de ~43 caracteres).

**Impacto:** GSC no puede verificar la propiedad. Si la verificacion previa fue por DNS o archivo HTML, esto NO afecta. Si fue por meta tag, la propiedad no esta verificada.

**Fix propuesto:**
1. Usuario va a Search Console > Configuracion > Verificacion de propiedad.
2. Copia el `content` del meta tag `google-site-verification`.
3. Lo pega en `verification.google` del layout.

USUARIO CONFIRMO: tiene acceso y pasara el codigo.

---

### C3. /catalog sin metadata SEO propia

**Archivo:** `app/catalog/page.tsx`

**Problema:**
La pagina mas comercial del sitio (catalogo de bolsos) **no exporta `metadata`**. Hereda solo el title generico del root layout.

**Impacto:**
- En SERP aparece con title del layout, no optimizado para "bolsos de lujo en alquiler".
- No tiene description propia, canonical ni Open Graph.
- Pierde keywords clave: "alquiler bolsos Chanel Madrid", "Hermes Birkin alquiler", etc.

**Fix propuesto:** anadir export `metadata` con:
- `title`: "Catalogo de bolsos de lujo en alquiler | Semzo Prive"
- `description`: "Mas de 200 bolsos de Chanel, Hermes, Louis Vuitton, Dior y Gucci disponibles para alquilar. Renueva tu look cada mes."
- `openGraph`, `canonical`, etc.

---

## MEDIOS (oportunidades perdidas)

### M1. Paginas /membership/upgrade en sitemap

**Archivos detectados:**
- `/membership/upgrade/signature`
- `/membership/upgrade/prive`
- `/membership/upgrade/essentiel`
- `/membership/upgrade/petite`

**Problema:** Son flujos POST-LOGIN para usuarios con membresia activa. Indexarlas:
- Crea contenido sin valor para SEO (paginas que requieren auth).
- Puede canibalizar la home y `/pricing`.
- Anade URLs de baja calidad a Google.

**Fix propuesto:**
- Quitar del sitemap.
- Anadir `metadata.robots: { index: false }` en cada pagina.

---

### M2. minimumCacheTTL muy bajo

**Archivo:** `next.config.mjs`

**Problema:**
```js
images: {
  minimumCacheTTL: 60  // 60 segundos
}
```

Las imagenes de producto cambian raramente. 60 segundos fuerza a Vercel a regenerar el optimizer constantemente, aumentando coste y empeorando LCP.

**Fix propuesto:** `minimumCacheTTL: 2678400` (31 dias).

---

### M3. Paginas faltantes en sitemap dinamico

**Detectadas existentes pero NO listadas:**
- `/calculadora-ahorro`
- `/lista-privada`
- `/recommendations`
- `/membresias` (si existe como landing publica)

**Fix propuesto:** anadir estas rutas al array de URLs estaticas en `app/sitemap.ts`.

---

### M4. Duplicacion /invitation vs /invitacion

**Problema:** Existen dos rutas separadas con codigo casi identico. Aunque ambas tengan `noindex`, mantener dos copias es deuda tecnica.

**Fix propuesto:**
- Mantener una sola ruta canonica (preferiblemente `/invitacion` para SEO en espanol).
- Anadir redirect 301 en `next.config.mjs` desde la otra.

---

## BAJOS (mejoras nice-to-have)

### B1. Inconsistencia mensaje layout vs home

**Layout title:** "Alquiler de Bolsos de Lujo en Espana - Semzo Prive"
**Home H1:** "Club de bolsos de disenador por suscripcion"

Cohabitan dos posicionamientos: "alquiler" (search intent comercial fuerte) vs "club por suscripcion" (branding premium).

**Fix propuesto:** alinear ambos en torno a "Club de alquiler de bolsos de lujo por suscripcion" para no perder ninguno de los dos search intents.

---

### B2. Falta opengraph-image dinamica

**Problema:** `opengraph-image.tsx` no existe en raiz. Se esta usando una imagen hardcoded como `og:image`.

**Fix propuesto:** crear `app/opengraph-image.tsx` que genere la imagen on-the-fly con el branding correcto. Mejora compartidos en redes.

---

### B3. RSS no enlazado desde head

**Problema:** Existen rewrites `/rss.xml` y `/rss-pinterest.xml`, pero el `<head>` no contiene `<link rel="alternate" type="application/rss+xml">`. Esto evita que lectores RSS y Pinterest descubran el feed.

**Fix propuesto:** anadir en `metadata.alternates.types`:
```ts
"application/rss+xml": "/rss.xml"
```

---

## DECISION USUARIO (2026-04-29)

- **Alcance:** Solo analisis, no tocar codigo aun.
- **Search Console:** usuario pasara el codigo de verificacion para C2.

## PROXIMOS PASOS (cuando usuario lo apruebe)

1. Esperar codigo GSC del usuario para C2.
2. Aplicar CRITICOS (C1, C2, C3) primero - bajo riesgo, alto impacto.
3. Tras 2-3 dias en produccion, verificar que GSC re-indexa correctamente.
4. Aplicar MEDIOS (M1-M4) en segunda iteracion.
5. BAJOS (B1-B3) cuando todo lo anterior este estable.

---

Generado: 2026-04-29
Ingeniero: v0 senior dev
