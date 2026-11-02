import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { parseBagDimensions } from "@/lib/virtual-tryon"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/admin/tryon/bags
 * Bolsos que se pueden probar: solo los DISPONIBLES (los alquilados, en Colecciona o en mantenimiento no existen
 * ahora mismo para la socia) y que tengan medidas legibles en la descripcion.
 */
export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from("bags")
    .select("id, brand, name, description, image_url")
    .eq("status", "available")
    .order("brand")
    .order("name")
  if (error) return NextResponse.json({ error: "No se pudieron cargar los bolsos" }, { status: 500 })

  const bags = (data ?? []).flatMap((b) => {
    const dims = parseBagDimensions(b.description)
    if (!dims || !b.image_url) return []
    return [{ id: b.id, brand: b.brand, name: b.name, image_url: b.image_url, dims }]
  })
  return NextResponse.json({ bags, hidden: (data?.length ?? 0) - bags.length })
}
