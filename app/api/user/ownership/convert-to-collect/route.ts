import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { startCollectProgress } from "@/lib/ownership-collect-start"

export const dynamic = "force-dynamic"

/**
 * POST /api/user/ownership/convert-to-collect
 *
 * Convertir el bolso actual de Modo Descubre (alquiler) a Modo Colecciona.
 * Toda la logica (facturas elegibles, libro de credito, accumulated) vive en
 * startCollectProgress. Si ya existe un progreso Colecciona activo para ese
 * usuario+bolso no se cancela ni se recrea nada: responde 409 { code: 'already_collect' }.
 * Nunca marca 'completed': la compra se cierra en el webhook de Stripe.
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const bagId = body.bag_id as string | undefined
    if (!bagId) {
      return NextResponse.json({ error: "bag_id requerido" }, { status: 400 })
    }

    const result = await startCollectProgress(user.id, bagId)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, code: result.code, ownership_progress_id: result.progress_id },
        { status: result.status },
      )
    }

    return NextResponse.json({
      success: true,
      ownership_progress_id: result.progress_id,
      initial_credit: result.initial_credit,
      ready_to_finalize: result.ready_to_finalize,
    })
  } catch (err) {
    console.error("[v0] ownership/convert-to-collect error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
