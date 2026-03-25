import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { nombre, email, whatsapp } = await request.json()

    if (!nombre || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar si el email ya esta registrado
    const { data: existing } = await supabase
      .from("invitation_registrations")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Este email ya está registrado", alreadyRegistered: true },
        { status: 409 }
      )
    }

    // Insertar nuevo registro
    const { error } = await supabase
      .from("invitation_registrations")
      .insert({
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        whatsapp: whatsapp?.trim() || null,
        codigo_descuento: "PRIVE50"
      })

    if (error) {
      console.error("Error inserting invitation registration:", error)
      return NextResponse.json(
        { error: "Error al registrar. Por favor intenta de nuevo." },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "Registro exitoso",
      codigo: "PRIVE50"
    })

  } catch (error) {
    console.error("Error in invitation-register:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
