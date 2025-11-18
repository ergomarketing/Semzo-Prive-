import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { subject, htmlContent, textContent } = await request.json()

    // Validar que tenemos la API key de SendGrid
    const apiKey = process.env.EMAIL_API_KEY
    if (!apiKey) {
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
      throw new Error("Failed to fetch subscribers")
    }

    const subscribers = await subsResponse.json()

    if (subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscribers to send to",
        sent: 0,
      })
    }

    // Enviar emails usando SendGrid
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: subscribers.map((sub: { email: string }) => ({
          to: [{ email: sub.email }],
        })),
        from: {
          email: "info@semzoprive.com",
          name: "Semzo Privé",
        },
        subject: subject,
        content: [
          {
            type: "text/plain",
            value: textContent,
          },
          {
            type: "text/html",
            value: htmlContent,
          },
        ],
      }),
    })

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text()
      console.error("SendGrid error:", errorText)
      throw new Error(`SendGrid API error: ${sendGridResponse.status}`)
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      sent: subscribers.length,
    })
  } catch (error) {
    console.error("Error sending newsletter:", error)
    return NextResponse.json(
      { error: "Failed to send newsletter", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
