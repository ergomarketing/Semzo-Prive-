import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let body: { rating?: unknown; comment?: unknown; consentToPublish?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 })
  }

  const rating = Number(body.rating)
  if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
    return NextResponse.json({ error: "La puntuación debe ser un número entre 0 y 10" }, { status: 400 })
  }

  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : ""
  const consentToPublish = body.consentToPublish === true

  // Asocia la opinión a la reserva más reciente de la socia, si existe.
  // No es bloqueante: si no hay reserva, la opinión se guarda igual.
  const { data: lastReservation } = await supabase
    .from("reservations")
    .select("id, bag_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error: insertError } = await supabase.from("reviews").insert({
    user_id: user.id,
    reservation_id: lastReservation?.id ?? null,
    bag_id: lastReservation?.bag_id ?? null,
    rating,
    comment: comment || null,
    consent_to_publish: consentToPublish,
  })

  if (insertError) {
    console.log("[v0] Error al guardar opinión:", insertError.message)
    return NextResponse.json({ error: "No se pudo guardar tu opinión" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
