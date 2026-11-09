/**
 * CRON: renovacion automatica del pase semanal en Modo Colecciona (socias Petite).
 * Avisa del cobro, cobra el pase cuando vence y alarga la reserva. Ver lib/colecciona-pass-renewal.ts.
 * Frecuencia: diaria (09:00 UTC en vercel.json).
 */
import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { isAuthorizedCron } from "@/lib/cron-auth"
import { runColeccionaPassRenewals } from "@/lib/colecciona-pass-renewal"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const summary = await runColeccionaPassRenewals(supabase)
    return NextResponse.json({ ok: true, ...summary })
  } catch (err) {
    console.error("[colecciona-pass-renewals] Error:", err)
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Error" }, { status: 500 })
  }
}
