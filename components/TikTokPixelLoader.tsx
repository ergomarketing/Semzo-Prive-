"use client"

// TikTokPixel ya es un Client Component con 'use client'.
// Importarlo directamente aquí (también Client Component) evita
// cualquier conflicto con ssr:false en Server Components.
import TikTokPixel from "@/components/TikTokPixel"

export default function TikTokPixelLoader() {
  return <TikTokPixel />
}
