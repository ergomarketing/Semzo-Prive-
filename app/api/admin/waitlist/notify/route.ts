import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    const { entryId, email, bagName } = await request.json()

    try {
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: `¡El bolso ${bagName} está disponible!`,
            message: `Hola,\n\nEl bolso ${bagName} que estabas esperando ahora está disponible para alquilar.\n\nVisita nuestra web para hacer tu reserva: ${process.env.NEXT_PUBLIC_SITE_URL}/magazine\n\nSaludos,\nSemzo Privé`,
          }),
        },
      )

      if (!emailResponse.ok) {
        console.error("[v0] Error al enviar email:", await emailResponse.text())
      }
    } catch (emailError) {
      console.error("[v0] Error sending email:", emailError)
    }

    // Marcar como notificado en la base de datos
    const { error: updateError } = await supabase
      .from("waitlist")
      .update({
        notified: true,
        notified_at: new Date().toISOString(),
      })
      .eq("id", entryId)

    if (updateError) throw updateError

    console.log(`[v0] Notificación enviada a ${email} para ${bagName}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error notifying user:", error)
    return NextResponse.json({ error: "Error al enviar notificación" }, { status: 500 })
  }
}
