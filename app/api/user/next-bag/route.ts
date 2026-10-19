import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { cancelQueuedReservation, getNextBagState } from "@/lib/next-bag-queue"

export const dynamic = "force-dynamic"

function serviceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function authenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * GET /api/user/next-bag
 * Estado del "proximo bolso" de la socia: si puede reservar uno mas ahora (ultimos 7 dias del ciclo, con un bolso
 * en curso), cuando se abre la ventana, y su reserva en cola si la tiene. Solo lectura.
 */
export async function GET() {
  const userId = await authenticatedUserId()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  const state = await getNextBagState(serviceClient(), userId)
  return NextResponse.json(state)
}

/**
 * DELETE /api/user/next-bag
 * Cancela el proximo bolso en cola (libera el bolso y devuelve el Pase de Bolso si se uso uno).
 * Solo se puede mientras esta en cola: una vez confirmado ya entra en el flujo de envio.
 */
export async function DELETE() {
  const userId = await authenticatedUserId()
  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  const result = await cancelQueuedReservation(serviceClient(), userId, "cancelled_by_member")
  if (!result.cancelled) {
    return NextResponse.json({ error: "No tienes ningún próximo bolso en cola" }, { status: 404 })
  }
  return NextResponse.json({ success: true, message: "Tu próximo bolso se ha cancelado." })
}
