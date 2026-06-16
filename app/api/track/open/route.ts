import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Pixel de tracking de apertura — devuelve una imagen 1x1 transparente
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eid = searchParams.get("eid")

  if (eid) {
    await supabase
      .from("email_sequence_log")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", eid)
      .is("opened_at", null) // solo primera apertura
  }

  // GIF transparente 1x1
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  )

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
