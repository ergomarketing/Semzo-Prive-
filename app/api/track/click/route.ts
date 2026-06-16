import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eid = searchParams.get("eid")
  const url = searchParams.get("url")

  if (eid) {
    await supabase
      .from("email_sequence_log")
      .update({ clicked_at: new Date().toISOString() })
      .eq("id", eid)
      .is("clicked_at", null) // solo primer clic
  }

  const destination = url ? decodeURIComponent(url) : (process.env.APP_URL || "https://semzoprive.com")

  return NextResponse.redirect(destination, { status: 302 })
}
