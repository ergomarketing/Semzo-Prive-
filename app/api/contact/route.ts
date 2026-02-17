import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, priority } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    console.log("[v0] 📞 Nueva consulta de contacto:", subject)

    const { data, error } = await supabase
      .from("contacts")
      .insert([
        {
          name,
          email,
          subject,
          message,
          priority: priority || "Media",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error("[v0] ❌ Error storing contact in Supabase:", error)
      return NextResponse.json({ error: "Error guardando consulta" }, { status: 500 })
    }

    const ticketId = `TICKET-${data[0].id.substring(0, 8).toUpperCase()}`

    try {
      const { adminNotifications } = await import("@/lib/admin-notifications")
      await adminNotifications.notifyNewContact({
        name,
        email,
        subject,
        message,
        priority: priority || "Media",
        ticketId,
      })
      console.log("[v0] ✅ Notificación administrativa enviada")
    } catch (notifError) {
      console.error("[v0] ❌ Error enviando notificación administrativa:", notifError)
    }

    console.log("[v0] ✅ Consulta guardada en Supabase exitosamente")
    return NextResponse.json({
      success: true,
      message: "Consulta enviada exitosamente",
      data: {
        ticketId,
        estimatedResponse: "24 horas",
      },
    })
  } catch (error) {
    console.error("[v0] ❌ Error en formulario de contacto:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
