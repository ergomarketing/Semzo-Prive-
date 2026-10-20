import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"
import { promoteQueuedReservation } from "@/lib/next-bag-queue"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    console.log("[v0] Admin reservations API called")

    const { data: reservations, error: reservationsError } = await supabase
      .from("reservations")
      .select(`
        *,
        profiles:user_id(full_name, email),
        bags:bag_id(name, brand, image_url)
      `)
      .order("created_at", { ascending: false })

    console.log("[v0] Raw reservations from DB:", reservations?.length, "Error:", reservationsError)

    if (reservationsError) {
      console.error("[v0] Error fetching reservations:", reservationsError)
      return NextResponse.json({
        reservations: [],
        stats: { total: 0, active: 0, pending: 0, completed: 0, cancelled: 0, overdue: 0 },
      })
    }

    const processedReservations = (reservations || []).map((reservation) => ({
      id: reservation.id,
      user_id: reservation.user_id,
      bag_id: reservation.bag_id,
      bag_name: reservation.bags?.name || "Bolso desconocido",
      bag_brand: reservation.bags?.brand || "Marca desconocida",
      bag_image: reservation.bags?.image_url || null,
      customer_name: reservation.profiles?.full_name || "Cliente desconocido",
      customer_email: reservation.profiles?.email || "Email desconocido",
      start_date: reservation.start_date,
      end_date: reservation.end_date,
      status: reservation.status,
      total_amount: reservation.total_amount,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
    }))

    const stats = {
      total: processedReservations.length,
      active: processedReservations.filter((r) => r.status === "active").length,
      pending: processedReservations.filter((r) => r.status === "pending").length,
      confirmed: processedReservations.filter((r) => r.status === "confirmed").length,
      completed: processedReservations.filter((r) => r.status === "completed").length,
      cancelled: processedReservations.filter((r) => r.status === "cancelled").length,
      overdue: processedReservations.filter((r) => r.status === "overdue").length,
    }

    console.log("[v0] Processed reservations:", processedReservations.length, "Stats:", stats)

    return NextResponse.json({
      reservations: processedReservations,
      stats,
    })
  } catch (error) {
    console.error("[v0] Admin reservations API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const { id, status } = await request.json()
    console.log("[v0] Updating reservation:", id, "to status:", status)

    const { data, error } = await supabase
      .from("reservations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating reservation:", error)
      throw error
    }

    console.log("[v0] Reservation updated:", data)

    // Cerrar la reserva a mano tambien debe activar el "proximo bolso" en cola de esa socia (si lo tiene).
    if (status === "completed" && data?.user_id) {
      const promotion = await promoteQueuedReservation(supabase, data.user_id)
      if (promotion.promoted) {
        await supabase.from("admin_notifications").insert({
          type: "next_bag_ready_to_ship",
          priority: "high",
          title: "Próximo bolso listo para enviar",
          message: `Cerraste la reserva a mano y la socia tenía su PRÓXIMO BOLSO (${promotion.bagLabel}) en cola: ya está confirmado, prepara el envío.`,
          metadata: { user_id: data.user_id, reservation_id: promotion.reservationId },
        })
      }
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating reservation:", error)
    return NextResponse.json({ error: "Error updating reservation" }, { status: 500 })
  }
}
