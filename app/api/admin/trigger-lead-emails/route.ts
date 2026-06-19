import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Solo admin puede llamar esto
export async function POST() {
  try {
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
    const cronSecret = process.env.CRON_SECRET || "un-token-secreto-que-tu-eliges"

    const res = await fetch(`${appUrl}/api/cron/send-lead-emails`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    })

    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json({ error: "Error al disparar cron" }, { status: 500 })
  }
}
