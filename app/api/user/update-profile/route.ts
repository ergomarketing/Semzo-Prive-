import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getServiceClient } from "@/lib/supabase-service"

export const dynamic = "force-dynamic"

// Texto limpio y acotado: sin espacios sobrantes y con un maximo razonable por campo.
const clean = (value: unknown, max: number): string | null => {
  if (typeof value !== "string") return null
  const v = value.trim().slice(0, max)
  return v.length ? v : null
}

export async function POST(request: Request) {
  try {
    // La persona sale SIEMPRE de la sesion del servidor. El userId que mande el navegador se ignora.
    const session = await createClient()
    const {
      data: { user },
    } = await session.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const fullName = clean(body.fullName, 120)
    const nameParts = (fullName || "").split(/\s+/)

    const { error } = await getServiceClient()
      .from("profiles")
      .update({
        full_name: fullName,
        first_name: nameParts[0] || null,
        last_name: nameParts.slice(1).join(" ") || null,
        phone: clean(body.phone, 30),
        document_type: clean(body.documentType, 30),
        document_number: clean(body.documentNumber, 40),
        shipping_address: clean(body.address, 200),
        shipping_city: clean(body.city, 100),
        shipping_postal_code: clean(body.postalCode, 20),
        shipping_country: clean(body.country, 80) || "España",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      // Solo datos tecnicos en el log: nunca el documento, el telefono ni la direccion.
      console.error("[update-profile] error al guardar", { userId: user.id, code: error.code })
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ese teléfono ya está asociado a otra cuenta." }, { status: 409 })
      }
      return NextResponse.json({ error: "No se pudieron guardar los datos. Inténtalo de nuevo." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[update-profile] error", error?.message)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
