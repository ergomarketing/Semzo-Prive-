import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: Request) {
  try {
    const { userId, fullName, phone, documentType, documentNumber, address, city, postalCode, country } =
      await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 })
    }

    const { error } = await supabase
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

    if (error) {
      console.error("Error updating profile:", error)
      return NextResponse.json({ error: "Error al actualizar perfil: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error:", error)
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
