import { NextResponse } from "next/server"
import { supabase } from "@/app/lib/supabaseClient"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { subject, content } = await request.json()

    if (!subject || !content) {
      return NextResponse.json({ error: "Subject and content are required" }, { status: 400 })
    }

    const { data: subscribers, error: fetchError } = await supabase
      .from("newsletter_subscribers")
      .select("email, name")
      .eq("status", "active")

    if (fetchError) throw fetchError

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: "No active subscribers found", sent: 0 }, { status: 400 })
    }

    const emailApiKey = process.env.EMAIL_API_KEY

    if (!emailApiKey) {
      return NextResponse.json(
        { error: "EMAIL_API_KEY not configured. Please add it to environment variables." },
        { status: 500 }
      )
    }

    const sendPromises = subscribers.map(async (subscriber) => {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "newsletter@semzoprive.com",
            to: subscriber.email,
            subject: subject,
            html: content,
            text: content.replace(/<[^>]*>/g, ""),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`Failed to send to ${subscriber.email}:`, errorData)
          return { email: subscriber.email, success: false, error: errorData }
        }

        return { email: subscriber.email, success: true }
      } catch (error) {
        console.error(`Error sending to ${subscriber.email}:`, error)
        return { email: subscriber.email, success: false, error }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      sent: successful,
      failed: failed,
      total: subscribers.length,
      results: results,
    })
  } catch (error) {
    console.error("Error sending newsletter:", error)
    return NextResponse.json({ error: "Failed to send newsletter", details: String(error) }, { status: 500 })
  }
}
