import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createRouteHandlerClient } from "@/lib/supabase"

/**
 * GET /api/attribution/prompt
 *
 * Indica si hay que mostrar en el dashboard la pregunta de un toque
 * "¿Como nos conociste?": cuenta reciente (<30 dias) que aun no ha declarado
 * su origen (sin fila en signup_attribution o con self_reported nulo).
 *
 *   200 { eligible: boolean }
 *   401 { eligible: false }
 *
 * Nunca falla "hacia arriba": ante cualquier error responde eligible:false para
 * no mostrar la pregunta ni ensuciar el dashboard.
 */
const PROMPT_MAX_ACCOUNT_AGE_MS = 30 * 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return NextResponse.json({ eligible: false }, { status: 401 })

    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
    if (!createdAt || Date.now() - createdAt > PROMPT_MAX_ACCOUNT_AGE_MS) {
      return NextResponse.json({ eligible: false })
    }

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    })
    const { data, error } = await admin
      .from("signup_attribution")
      .select("self_reported")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ eligible: false })

    return NextResponse.json({ eligible: !data?.self_reported })
  } catch {
    return NextResponse.json({ eligible: false })
  }
}
