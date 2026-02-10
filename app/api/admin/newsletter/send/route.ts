import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { subject, content } = await request.json()

    if (!subject || !content) {
      return NextResponse.json({ error: "Asunto y contenido son requeridos" }, { status: 400 })
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_SUPABASE_URL

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración del servidor incorrecta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener suscriptores activos
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscriptions")
      .select("email, name")
      .eq("status", "active")

    if (error) {
      console.error("[v0] Error fetching subscribers:", error)
      return NextResponse.json({ error: "Error al obtener suscriptores" }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: "No hay suscriptores activos", sent: 0 }, { status: 400 })
    }

    const resendApiKey = process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.log("[v0] Email API no configurado, simulando envío")
      return NextResponse.json({
        success: true,
        sent: subscribers.length,
        simulated: true,
        message: `Newsletter simulado para ${subscribers.length} suscriptores (API no configurada)`,
      })
    }

    // Enviar a cada suscriptor usando Resend API
    let sentCount = 0
    const errors: string[] = []

    for (const subscriber of subscribers) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Semzo Privé <noreply@semzoprive.com>",
            to: [subscriber.email],
            subject,
            html: `
              <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background-color: #fdf8f5; padding: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1a2c4e; font-size: 28px; margin: 0;">Semzo Privé</h1>
                  <p style="color: #d4a5a5; font-size: 14px; margin: 5px 0 0 0;">Luxury Bag Rental</p>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 8px; border: 1px solid #e8dcd5;">
                  ${subscriber.name ? `<p style="color: #1a2c4e;">Hola ${subscriber.name},</p>` : ""}
                  <div style="color: #333; line-height: 1.6;">
                    ${content}
                  </div>
                </div>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e8dcd5;">
                  <p style="color: #888; font-size: 12px; margin: 0;">
                    Semzo Privé - Tu destino de lujo
                  </p>
                </div>
              </div>
            `,
          }),
        })

        if (response.ok) {
          sentCount++
        } else {
          const errorText = await response.text()
          console.error(`[v0] Error enviando a ${subscriber.email}:`, errorText)
          errors.push(subscriber.email)
        }
      } catch (emailError) {
        console.error(`[v0] Error enviando a ${subscriber.email}:`, emailError)
        errors.push(subscriber.email)
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Error sending newsletter:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al enviar newsletter" },
      { status: 500 },
    )
  }
}
