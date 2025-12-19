import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: Request) {
  try {
    const { userId, fullName, phone, documentType, documentNumber, address, city, postalCode, country } =
      await request.json()

    console.log("[v0 API] Recibiendo datos:", {
      userId,
      fullName,
      phone,
      documentType,
      documentNumber,
      address,
      city,
      postalCode,
      country,
    }) // Log para debug

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 })
    }

    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (fetchError) {
      console.error("[v0 API] Error al buscar perfil:", fetchError)
      return NextResponse.json({ error: "Perfil no encontrado: " + fetchError.message }, { status: 404 })
    }

    console.log("[v0 API] Perfil existente encontrado:", existingProfile)

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        document_type: documentType,
        document_number: documentNumber,
        address,
        city,
        postal_code: postalCode,
        country,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()

    if (error) {
      console.error("[v0 API] Error updating profile:", error)
      return NextResponse.json({ error: "Error al actualizar perfil: " + error.message }, { status: 500 })
    }

    console.log("[v0 API] Perfil actualizado exitosamente:", data)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[v0 API] Error:", error)
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
