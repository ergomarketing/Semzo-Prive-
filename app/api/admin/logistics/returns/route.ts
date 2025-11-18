import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

/**
 * GET /api/admin/logistics/returns
 * Obtener lista de devoluciones
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const reason = searchParams.get("reason")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = supabase.from("returns").select(
      `
      id,
      shipment_id,
      reason,
      status,
      return_tracking,
      return_carrier,
      refund_amount,
      created_at,
      updated_at,
      shipments (
        id,
        reservation_id,
        tracking_number,
        reservations (
          id,
          profiles (
            full_name,
            email
          ),
          bags (
            name,
            brand
          )
        )
      )
    `,
      { count: "exact" }
    )

    if (status) {
      query = query.eq("status", status)
    }
    if (reason) {
      query = query.eq("reason", reason)
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("[Logistics API] Error fetching returns:", error)
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
 * POST /api/admin/logistics/returns
 * Crear una nueva devolución
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      shipment_id,
      reason,
      notes,
      return_carrier,
      return_tracking,
      refund_amount,
    } = body

    if (!shipment_id) {
      return NextResponse.json(
        { error: "shipment_id is required" },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 })
    }

    // Verificar que el envío existe
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("id")
      .eq("id", shipment_id)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      )
    }

    // Crear la devolución
    const { data, error } = await supabase
      .from("returns")
      .insert({
        shipment_id,
        reason,
        status: "pending",
        notes: notes || null,
        return_carrier: return_carrier || null,
        return_tracking: return_tracking || null,
        refund_amount: refund_amount || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[Logistics API] Error creating return:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Actualizar estado del envío a "returned"
    await supabase
      .from("shipments")
      .update({ status: "returned" })
      .eq("id", shipment_id)

    // Crear evento de devolución
    await supabase.from("shipment_events").insert({
      shipment_id,
      event_type: "returned",
      description: `Return initiated: ${reason}`,
    })

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "create_return",
      entity_type: "return",
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
 * PATCH /api/admin/logistics/returns
 * Actualizar una devolución
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, return_tracking, return_carrier, refund_amount, notes } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Obtener la devolución actual para auditoría
    const { data: oldData } = await supabase
      .from("returns")
      .select()
      .eq("id", id)
      .single()

    // Actualizar la devolución
    const { data, error } = await supabase
      .from("returns")
      .update({
        status: status || undefined,
        return_tracking: return_tracking !== undefined ? return_tracking : undefined,
        return_carrier: return_carrier !== undefined ? return_carrier : undefined,
        refund_amount: refund_amount !== undefined ? refund_amount : undefined,
        notes: notes !== undefined ? notes : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Logistics API] Error updating return:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si el estado cambió, crear un evento
    if (status && oldData?.status !== status) {
      const shipment = await supabase
        .from("returns")
        .select("shipment_id")
        .eq("id", id)
        .single()

      if (shipment.data) {
        await supabase.from("shipment_events").insert({
          shipment_id: shipment.data.shipment_id,
          event_type: `return_${status}`,
          description: `Return status updated to ${status}`,
        })
      }
    }

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "update_return",
      entity_type: "return",
      entity_id: id,
      old_values: oldData,
      new_values: data,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
