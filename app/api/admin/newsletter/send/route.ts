import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { subject, htmlContent, textContent } = await request.json()

    console.log("[v0] 📧 Iniciando envío de newsletter")

    // Validar que tenemos la API key de SendGrid
    const apiKey = process.env.EMAIL_API_KEY
    if (!apiKey) {
      console.error("[v0] ❌ SendGrid API key not found")
      return NextResponse.json(
        { error: "SendGrid API key not configured" },
        { status: 500 }
      )
    }

    // Obtener todos los suscriptores activos
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      )
    }

    console.log("[v0] 📊 Obteniendo suscriptores activos...")

    const subsResponse = await fetch(
      `${supabaseUrl}/rest/v1/newsletter_subscriptions?status=eq.active&select=email`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!subsResponse.ok) {
      const errorText = await subsResponse.text()
      console.error("[v0] ❌ Error fetching subscribers:", errorText)
      throw new Error("Failed to fetch subscribers")
    }

    const subscribers = await subsResponse.json()
    console.log(`[v0] 👥 Found ${subscribers.length} active subscribers`)

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscribers to send to",
        sent: 0,
      })
    }

    const sendGridPayload = {
      personalizations: subscribers.map((sub: { email: string }) => ({
        to: [{ email: sub.email }],
      })),
      from: {
        email: "newsletter@semzoprive.com", // Usa un email específico para newsletters
        name: "Semzo Privé Magazine",
      },
      reply_to: {
        email: "info@semzoprive.com",
        name: "Semzo Privé",
      },
      subject: subject,
      content: [
        {
          type: "text/plain",
          value: textContent || "Para ver este mensaje, por favor habilita HTML en tu cliente de correo.",
        },
        {
          type: "text/html",
          value: htmlContent,
        },
      ],
    }

    console.log("[v0] 📤 Enviando a SendGrid:", {
      recipients: subscribers.length,
      subject,
    })

    // Enviar emails usando SendGrid
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendGridPayload),
    })

    const responseText = await sendGridResponse.text()

    if (!sendGridResponse.ok) {
      console.error("[v0] ❌ SendGrid error:", {
        status: sendGridResponse.status,
        statusText: sendGridResponse.statusText,
        body: responseText,
      })
      
      // Parsear el error de SendGrid si es JSON
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = JSON.stringify(errorJson, null, 2)
      } catch {}
      
      return NextResponse.json(
        {
          error: "Failed to send via SendGrid",
          details: errorDetails,
          status: sendGridResponse.status,
        },
        { status: 500 }
      )
    }

    console.log("[v0] ✅ Newsletter sent successfully to", subscribers.length, "subscribers")

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      sent: subscribers.length,
    })
  } catch (error) {
    console.error("[v0] ❌ Error sending newsletter:", error)
    return NextResponse.json(
      { 
        error: "Failed to send newsletter", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
