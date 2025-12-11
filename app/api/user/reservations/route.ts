export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabase()   // ← FALTABA ESTO

    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { reservation_id, status } = body

    if (!reservation_id || !status) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: reservation_id, status" },
        { status: 400 }
      )
    }

    const validStatuses = ["cancelled", "completed", "active", "confirmed", "pending"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Estado de reserva no válido" },
        { status: 400 }
      )
    }

    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, bag_id, status")
      .eq("id", reservation_id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    if (reservation.user_id !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar esta reserva" },
        { status: 403 }
      )
    }

    // Actualizar estado de la reserva
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation_id)

    if (updateError) {
      return NextResponse.json(
        { error: "Error al actualizar la reserva", details: updateError.message },
        { status: 500 }
      )
    }

    // Si se cancela/completa → liberar bolso
    if (status === "cancelled" || status === "completed") {
      await supabase
        .from("bags")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", reservation.bag_id)
    }

    return NextResponse.json({
      success: true,
      message: `Reserva actualizada a: ${status}`,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in PATCH /api/user/reservations:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
