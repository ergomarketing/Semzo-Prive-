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

    // Split fullName into first_name and last_name
    const nameParts = (fullName || "").trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone,
        document_type: documentType,
        document_number: documentNumber,
        shipping_address: address, // Corrected column name
        shipping_city: city,       // Corrected column name
        shipping_postal_code: postalCode, // Corrected column name
        shipping_country: country || "España",
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
