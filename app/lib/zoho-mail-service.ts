interface ZohoMailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export const zohoMailConfig: ZohoMailConfig = {
  host: "smtp.zoho.eu",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ZOHO_EMAIL || "admin@semzoprive.com",
    pass: process.env.ZOHO_PASSWORD || "",
  },
}

export async function sendZohoEmail(to: string, subject: string, html: string) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject,
        html,
        from: zohoMailConfig.auth.user,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}
