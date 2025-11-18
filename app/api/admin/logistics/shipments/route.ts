import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

/**
 * GET /api/admin/logistics/shipments
 * Obtener lista de envíos con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const carrier = searchParams.get("carrier")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Construir query base
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
      reservations (
        id,
        start_date,
        end_date,
        profiles (
          full_name,
          email
        ),
        bags (
          name,
          brand
        )
      )
    `,
      { count: "exact" }
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
    const {
      reservation_id,
      carrier,
      tracking_number,
      estimated_delivery,
      cost,
      notes,
    } = body

    // Validar campos requeridos
    if (!reservation_id) {
      return NextResponse.json(
        { error: "reservation_id is required" },
        { status: 400 }
      )
    }

    // Verificar que la reserva existe
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("id")
      .eq("id", reservation_id)
      .single()

    if (reservationError || !reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      )
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
    const { data: oldData } = await supabase
      .from("shipments")
      .select()
      .eq("id", id)
      .single()

    // Actualizar el envío
    const { data, error } = await supabase
      .from("shipments")
      .update({
        status: status || undefined,
        carrier: carrier !== undefined ? carrier : undefined,
        tracking_number: tracking_number !== undefined ? tracking_number : undefined,
        estimated_delivery: estimated_delivery !== undefined ? estimated_delivery : undefined,
        cost: cost !== undefined ? cost : undefined,
        notes: notes !== undefined ? notes : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

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
