import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("[v0] invitation-register received:", body)
    
    const { nombre, email, whatsapp } = body

    if (!nombre || !email) {
      console.log("[v0] invitation-register: Missing nombre or email")
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      )
    }

    // Usar service_role para evitar problemas de RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
    console.log("[v0] invitation-register: Inserting new registration")
    const { data: insertData, error } = await supabase
      .from("invitation_registrations")
      .insert({
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        whatsapp: whatsapp?.trim() || null,
        codigo_descuento: "PRIVE50"
      })
      .select()

    if (error) {
      console.error("[v0] invitation-register: Insert error:", error)
      return NextResponse.json(
        { error: "Error al registrar. Por favor intenta de nuevo." },
        { status: 500 }
      )
    }

    console.log("[v0] invitation-register: Success, inserted:", insertData)
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
