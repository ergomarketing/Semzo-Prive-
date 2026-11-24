import type { SupabaseClient } from "@supabase/supabase-js"

function clean(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** "Yves Saint Laurent" + "Cassandre Envelope" -> "yves-saint-laurent-cassandre-envelope" (sin tildes ni simbolos). */
export function slugifyBag(brand: string | null | undefined, name: string | null | undefined): string {
  const b = clean(brand)
  const n = clean(name)
  // Si el nombre ya empieza por la marca ("Chanel Unchained Flap"), no se repite
  if (b && (n === b || n.startsWith(`${b}-`))) return n
  return [b, n].filter(Boolean).join("-")
}

/** Slug de la direccion web del bolso (/catalog/<slug>), unico: si ya existe, añade -2, -3... */
export async function uniqueBagSlug(
  supabase: SupabaseClient,
  brand: string | null | undefined,
  name: string | null | undefined,
): Promise<string | null> {
  const base = slugifyBag(brand, name)
  if (!base) return null
  for (let i = 1; i <= 20; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`
    const { data } = await supabase.from("bags").select("id").eq("slug", candidate).limit(1)
    if (!data || data.length === 0) return candidate
  }
  return null
}
