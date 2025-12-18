import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

function getMembershipDuration(planId: string): number {
  const durations: Record<string, number> = {
    petite: 7, // 7 días para pase semanal
    signature: 30, // 30 días
    "signature-quarterly": 90, // 90 días (trimestral)
    infinite: 30, // 30 días por ciclo
    "infinite-quarterly": 90, // 90 días
  }
  return durations[planId] || 30
}

async function activateMembershipOnDelivery(reservationId: string) {
  try {
    // Obtener la reserva con info del usuario
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("user_id, bags(name, brand)")
      .eq("id", reservationId)
      .single()

    if (resError || !reservation) {
      console.error("[Logistics] Error getting reservation:", resError)
      return
    }

    // Obtener el perfil del usuario para ver su plan
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("membership_type, membership_status, email, full_name")
      .eq("id", reservation.user_id)
      .single()

    if (profileError || !profile) {
      console.error("[Logistics] Error getting profile:", profileError)
      return
    }

    // Si ya tiene membresía activa con fecha, no modificar
    if (profile.membership_status === "active") {
      console.log("[Logistics] Membresía ya activa, actualizando fecha de inicio por nueva entrega")
    }

    const planId = profile.membership_type || "signature"
    const durationDays = getMembershipDuration(planId)
    const now = new Date()
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Actualizar perfil con fechas de membresía basadas en la entrega
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        membership_status: "active",
        membership_start_date: now.toISOString(),
        membership_end_date: endDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", reservation.user_id)

    if (updateError) {
      console.error("[Logistics] Error activating membership:", updateError)
      return
    }

    // También actualizar en user_memberships si existe
    await supabase
      .from("user_memberships")
      .update({
        status: "active",
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("user_id", reservation.user_id)
      .eq("status", "pending_delivery")

    // Actualizar la reserva como activa
    await supabase
      .from("reservations")
      .update({
        status: "active",
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", reservationId)

    console.log(
      `[Logistics] ✅ Membresía activada para usuario ${reservation.user_id}. Válida hasta: ${endDate.toISOString()}`,
    )

    // Enviar email de confirmación
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          subject: "¡Tu bolso ha sido entregado! Tu membresía está activa",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a4b;">¡Disfruta tu bolso!</h2>
              <p>Hola ${profile.full_name || ""},</p>
              <p>Tu bolso ha sido entregado exitosamente. A partir de ahora, tu membresía está activa.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Inicio de membresía:</strong> ${now.toLocaleDateString("es-ES")}</p>
                <p><strong>Válida hasta:</strong> ${endDate.toLocaleDateString("es-ES")}</p>
              </div>
              <p>¡Disfruta de tu experiencia Semzo Privé!</p>
            </div>
          `,
        }),
      })
    } catch (emailError) {
      console.error("[Logistics] Error sending delivery email:", emailError)
    }
  } catch (error) {
    console.error("[Logistics] Error in activateMembershipOnDelivery:", error)
  }
}

/**
 * GET /api/admin/logistics/shipments
 * Obtener lista de envíos con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const carrier = searchParams.get("carrier")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase.from("shipments").select(
      `
      id,
      reservation_id,
      status,
      carrier,
      tracking_number,
      estimated_delivery,
      actual_delivery,
      cost,
      created_at,
      updated_at,
      reservations!reservation_id (
        id,
        start_date,
        end_date,
        profiles!user_id (
          full_name,
          email
        ),
        bags!bag_id (
          name,
          brand
        )
      )
    `,
      { count: "exact" },
    )

    // Aplicar filtros
    if (status) {
      query = query.eq("status", status)
    }
    if (carrier) {
      query = query.eq("carrier", carrier)
    }

    // Aplicar paginación
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("[Logistics API] Error fetching shipments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/logistics/shipments
 * Crear un nuevo envío
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservation_id, carrier, tracking_number, estimated_delivery, cost, notes } = body

    // Validar campos requeridos
    if (!reservation_id) {
      return NextResponse.json({ error: "reservation_id is required" }, { status: 400 })
    }

    // Verificar que la reserva existe
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("id")
      .eq("id", reservation_id)
      .single()

    if (reservationError || !reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    // Crear el envío
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        reservation_id,
        status: "pending",
        carrier: carrier || null,
        tracking_number: tracking_number || null,
        estimated_delivery: estimated_delivery || null,
        cost: cost || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[Logistics API] Error creating shipment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "create_shipment",
      entity_type: "shipment",
      entity_id: data.id,
      new_values: data,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/logistics/shipments
 * Actualizar un envío
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, carrier, tracking_number, estimated_delivery, cost, notes } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Obtener el envío actual para auditoría
    const { data: oldData } = await supabase.from("shipments").select("*, reservation_id").eq("id", id).single()

    // Actualizar el envío
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status !== undefined) updateData.status = status
    if (carrier !== undefined) updateData.carrier = carrier
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number
    if (estimated_delivery !== undefined) updateData.estimated_delivery = estimated_delivery
    if (cost !== undefined) updateData.cost = cost
    if (notes !== undefined) updateData.notes = notes

    if (status === "delivered") {
      updateData.actual_delivery = new Date().toISOString()
    }

    const { data, error } = await supabase.from("shipments").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[Logistics API] Error updating shipment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "update_shipment",
      entity_type: "shipment",
      entity_id: id,
      old_values: oldData,
      new_values: data,
    })

    // Si el estado cambió, crear un evento
    if (status && oldData?.status !== status) {
      await supabase.from("shipment_events").insert({
        shipment_id: id,
        event_type: status,
        description: `Status updated to ${status}`,
      })

      if (status === "delivered" && oldData?.reservation_id) {
        await activateMembershipOnDelivery(oldData.reservation_id)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/logistics/shipments
 * Cancelar un envío
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Actualizar estado a cancelado en lugar de eliminar
    const { data, error } = await supabase
      .from("shipments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Logistics API] Error cancelling shipment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "cancel_shipment",
      entity_type: "shipment",
      entity_id: id,
      new_values: data,
    })

    return NextResponse.json({ message: "Shipment cancelled", data })
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
