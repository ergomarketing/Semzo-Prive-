import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { recordLegalAcceptance } from "@/lib/legal-acceptance"

export const dynamic = "force-dynamic"

const ALLOWED_CONTEXTS: Record<string, { document: string; version: string }> = {
  cart_terms: { document: "Términos y Condiciones + Política de Privacidad", version: "3.1" },
}

/**
 * POST /api/legal/accept
 * Body: { context: "cart_terms", reference_id?: string }
 * Registra que la usuaria autenticada aceptó los términos mostrados.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    if (!supabaseUser) return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const config = ALLOWED_CONTEXTS[body?.context as string]
    if (!config) return NextResponse.json({ error: "Contexto no válido" }, { status: 400 })

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const id = await recordLegalAcceptance(supabaseAdmin, {
      userId: user.id,
      context: body.context,
      document: config.document,
      documentVersion: config.version,
      referenceId: typeof body.reference_id === "string" ? body.reference_id : null,
      textSnapshot: "He leído y acepto los Términos y Condiciones y la Política de Privacidad",
      request,
    })

    if (!id) return NextResponse.json({ error: "No se pudo registrar" }, { status: 500 })
    return NextResponse.json({ success: true, id })
  } catch (err) {
    console.error("[v0] legal/accept error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
