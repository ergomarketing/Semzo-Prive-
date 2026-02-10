# Guía de Jerarquía de Encabezados H1-H6 para SEO

## Importancia para SEO

La jerarquía correcta de encabezados es crucial para:
- **Accesibilidad**: Los lectores de pantalla usan la jerarquía para navegar
- **SEO**: Google usa encabezados para entender la estructura del contenido
- **UX**: Usuarios escanean encabezados para encontrar información rápidamente

## Reglas de Jerarquía

### 1. Un único H1 por página
```tsx
// ✅ CORRECTO
<h1>Título Principal de la Página</h1>

// ❌ INCORRECTO - Múltiples H1
<h1>Primer título</h1>
<h1>Segundo título</h1>
```

### 2. No saltar niveles
```tsx
// ✅ CORRECTO
<h1>Título Principal</h1>
<h2>Sección 1</h2>
<h3>Subsección 1.1</h3>
<h3>Subsección 1.2</h3>
<h2>Sección 2</h2>

// ❌ INCORRECTO - Salta de H1 a H3
<h1>Título Principal</h1>
<h3>Subsección</h3>

// ❌ INCORRECTO - Salta de H2 a H4
<h2>Sección</h2>
<h4>Subsección</h4>
```

### 3. Los encabezados deben ser descriptivos
```tsx
// ✅ CORRECTO
<h2>Cómo funciona el proceso de alquiler</h2>
<h3>Paso 1: Elige tu bolso de lujo</h3>

// ❌ INCORRECTO - Poco descriptivo
<h2>Proceso</h2>
<h3>Paso 1</h3>
```

### 4. Usar sr-only cuando sea necesario para SEO
Cuando la jerarquía visual no coincide con la jerarquía semántica necesaria para SEO:

```tsx
// ✅ CORRECTO - H2 oculto visualmente pero presente para SEO
<section>
  <h2 className="sr-only">Pasos del proceso</h2>
  <div className="grid">
    <div>
      <h3>Paso 1: Elige</h3>
    </div>
    <div>
      <h3>Paso 2: Recibe</h3>
    </div>
  </div>
</section>
```

## Estructura de Encabezados por Página

### Homepage (/)
```
H1: "Tu puerta de acceso al armario de tus sueños"
├─ H2: "Nuestra Colección" (collection-section)
├─ H2: "Nuestras Membresías" (membership-section)
├─ H2: "Cómo Funciona" (how-it-works)
│  ├─ H3: Paso 1
│  ├─ H3: Paso 2
│  └─ H3: Paso 3
├─ H2: "Testimonios" (testimonial-section)
├─ H2: "Semzo Magazine" (magazine-section)
└─ H2: "Call to Action" (cta-section)
```

### Página Proceso (/proceso)
```
H1: "Cómo Funciona Semzo Privé"
├─ H2: "Pasos del proceso de alquiler" (sr-only)
│  ├─ H3: "Elige tu bolso"
│  ├─ H3: "Recibe en casa"
│  ├─ H3: "Disfruta con confianza"
│  └─ H3: "Intercambia cuando quieras"
├─ H2: "¿Por qué elegir Semzo Privé?"
│  ├─ H3: "100% Seguro"
│  ├─ H3: "Marcas Exclusivas"
│  └─ H3: "Flexibilidad Total"
└─ H2: "¿Lista para comenzar tu experiencia de lujo?"
```

### Blog Post (/blog/[slug])
```
H1: {post.title}
├─ H2: Sección del contenido
│  └─ H3: Subsección
├─ H2: Otra sección
└─ H2: Conclusión
```

### Página de Producto (/catalog/[id])
```
H1: {producto.nombre}
├─ H2: "Descripción"
├─ H2: "Detalles del producto"
├─ H2: "Política de alquiler"
└─ H2: "Productos similares"
```

## Checklist de Validación

Antes de hacer deploy, verificar:

- [ ] Cada página tiene exactamente un H1
- [ ] No hay saltos de niveles (H1 → H3, H2 → H4, etc.)
- [ ] Los H1 describen el contenido principal de la página
- [ ] Los H2 estructuran las secciones principales
- [ ] Los H3-H6 se usan para subsecciones
- [ ] Los encabezados son descriptivos y contienen palabras clave relevantes
- [ ] Se usa `sr-only` cuando la jerarquía visual difiere de la semántica

## Herramientas de Validación

### Extensiones de navegador
- **HeadingsMap** (Chrome/Firefox): Visualiza la jerarquía de encabezados
- **WAVE** (Chrome/Firefox): Auditoría completa de accesibilidad
- **Lighthouse** (Chrome DevTools): Auditoría SEO y accesibilidad

### Validación manual
```bash
# Buscar todos los encabezados en un archivo
grep -n "<h[1-6]" app/components/mi-componente.tsx
```

## Ejemplos de Correcciones Comunes

### Problema: Múltiples H1
```tsx
// ❌ ANTES
<h1>Bienvenido</h1>
<section>
  <h1>Nuestros Servicios</h1>
</section>

// ✅ DESPUÉS
<h1>Bienvenido</h1>
<section>
  <h2>Nuestros Servicios</h2>
</section>
```

### Problema: Salto de niveles
```tsx
// ❌ ANTES
<h2>Servicios</h2>
<div>
  <h4>Servicio 1</h4>
  <h4>Servicio 2</h4>
</div>

// ✅ DESPUÉS
<h2>Servicios</h2>
<div>
  <h3>Servicio 1</h3>
  <h3>Servicio 2</h3>
</div>
```

### Problema: Jerarquía visual vs semántica
```tsx
// ❌ ANTES - El H2 debería estar pero no visualmente
<section>
  <div className="grid">
    <h3>Paso 1</h3>
    <h3>Paso 2</h3>
  </div>
</section>

// ✅ DESPUÉS - H2 presente para SEO, oculto visualmente
<section>
  <h2 className="sr-only">Pasos del proceso</h2>
  <div className="grid">
    <h3>Paso 1</h3>
    <h3>Paso 2</h3>
  </div>
</section>
```

## Recursos Adicionales

- [MDN: Encabezados HTML](https://developer.mozilla.org/es/docs/Web/HTML/Element/Heading_Elements)
- [W3C: Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html)
- [Google SEO: Use heading tags to emphasize important text](https://developers.google.com/search/docs/appearance/structured-data/article#non-structured-data-guidelines)

---

**Última actualización**: Punto 9 de Auditoría SEO Técnica
**Mantenido por**: Equipo de desarrollo Semzo Privé
