import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Estados permitidos y sus transiciones
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

/**
 * GET - Obtener detalles de una reserva específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id")
    const reservationId = params.id

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log("[API] Fetching reservation details:", reservationId)

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(`
        *,
        bags (
          id,
          name,
          brand,
          image_url,
          daily_price,
          description,
          status
        ),
        profiles (
          id,
          full_name,
          email,
          phone,
          membership_type,
          membership_status
        )
      `)
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single()

    if (error || !reservation) {
      console.error("[API] Error fetching reservation:", error)
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      )
    }

    // Calcular información adicional
    const startDate = new Date(reservation.start_date)
    const endDate = new Date(reservation.end_date)
    const now = new Date()
    
    const daysTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    const daysUntilStart = Math.max(0, Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    const enrichedReservation = {
      ...reservation,
      computed: {
        days_total: daysTotal,
        days_remaining: daysRemaining,
        days_until_start: daysUntilStart,
        is_active: reservation.status === "active",
        is_upcoming: startDate > now && reservation.status === "confirmed",
        is_past: endDate < now,
        can_cancel: ["pending", "confirmed"].includes(reservation.status),
        can_modify: ["pending"].includes(reservation.status),
        allowed_transitions: ALLOWED_TRANSITIONS[reservation.status] || [],
      },
    }

    console.log("[API] Reservation details fetched successfully")

    return NextResponse.json({
      success: true,
      reservation: enrichedReservation,
    })
  } catch (error) {
    console.error("[API] Unexpected error in GET /api/user/reservations/[id]:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Actualizar una reserva (cambiar estado, cancelar, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id")
    const reservationId = params.id

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { status, cancellation_reason } = body

    // Obtener la reserva actual
    const { data: currentReservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, status, user_id, start_date, end_date")
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single()

    if (fetchError || !currentReservation) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    // Validar transición de estado
    if (status) {
      const allowedTransitions = ALLOWED_TRANSITIONS[currentReservation.status] || []
      
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            error: `No se puede cambiar de estado '${currentReservation.status}' a '${status}'`,
            allowed_transitions: allowedTransitions,
          },
          { status: 400 }
        )
      }

      // Validaciones específicas para cancelación
      if (status === "cancelled") {
        const startDate = new Date(currentReservation.start_date)
        const now = new Date()
        const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        // No permitir cancelación si la reserva ya comenzó
        if (currentReservation.status === "active") {
          return NextResponse.json(
            { error: "No se puede cancelar una reserva activa. Contacte a soporte." },
            { status: 400 }
          )
        }

        // Advertir si la cancelación es con menos de 24 horas
        if (hoursUntilStart < 24 && hoursUntilStart > 0) {
          console.warn("[API] Late cancellation (less than 24 hours):", reservationId)
        }
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
    }

    if (cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason
      updateData.cancelled_at = new Date().toISOString()
    }

    // Actualizar la reserva
    const { data: updatedReservation, error: updateError } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", reservationId)
      .eq("user_id", userId)
      .select(`
        *,
        bags (
          id,
          name,
          brand,
          image_url
        )
      `)
      .single()

    if (updateError) {
      console.error("[API] Error updating reservation:", updateError)
      return NextResponse.json(
        { error: "Error al actualizar la reserva", details: updateError.message },
        { status: 500 }
      )
    }

    console.log("[API] Reservation updated successfully:", {
      id: reservationId,
      oldStatus: currentReservation.status,
      newStatus: status,
    })

    return NextResponse.json({
      success: true,
      message: "Reserva actualizada exitosamente",
      reservation: updatedReservation,
    })
  } catch (error) {
    console.error("[API] Unexpected error in PATCH /api/user/reservations/[id]:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar una reserva (solo si está en estado 'pending')
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get("x-user-id")
    const reservationId = params.id

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Verificar que la reserva existe y pertenece al usuario
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, status")
      .eq("id", reservationId)
      .eq("user_id", userId)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    // Solo permitir eliminación de reservas pendientes
    if (reservation.status !== "pending") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar reservas en estado 'pending'" },
        { status: 400 }
      )
    }

    // Eliminar la reserva
    const { error: deleteError } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservationId)
      .eq("user_id", userId)

    if (deleteError) {
      console.error("[API] Error deleting reservation:", deleteError)
      return NextResponse.json(
        { error: "Error al eliminar la reserva", details: deleteError.message },
        { status: 500 }
      )
    }

    console.log("[API] Reservation deleted successfully:", reservationId)

    return NextResponse.json({
      success: true,
      message: "Reserva eliminada exitosamente",
    })
  } catch (error) {
    console.error("[API] Unexpected error in DELETE /api/user/reservations/[id]:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
