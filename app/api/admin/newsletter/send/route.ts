import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { subject, htmlContent, textContent } = await request.json()

    console.log("[v0] 📧 Iniciando envío de newsletter")

    // Validar que tenemos la API key de Resend
    const apiKey = process.env.EMAIL_API_KEY
    if (!apiKey) {
      console.error("[v0] ❌ Resend API key not found")
      return NextResponse.json(
        { error: "Email API key not configured" },
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

    console.log("[v0] 📤 Enviando newsletters con Resend...")

    const results = await Promise.allSettled(
      subscribers.map(async (sub: { email: string }) => {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Semzo Magazine <newsletter@semzoprive.com>",
            to: sub.email,
            subject: subject,
            html: htmlContent,
            text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[v0] ❌ Error enviando a ${sub.email}:`, errorText)
          throw new Error(`Failed to send to ${sub.email}`)
        }

        return { email: sub.email, success: true }
      })
    )

    const successful = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    console.log(`[v0] ✅ Newsletter enviado: ${successful} exitosos, ${failed} fallidos`)

    return NextResponse.json({
      success: true,
      message: `Newsletter enviado a ${successful} de ${subscribers.length} suscriptores`,
      sent: successful,
      failed: failed,
      total: subscribers.length,
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
