import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI, CORREOS_PRODUCTS } from "@/lib/correos-api"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Direccion de remitente (Semzo Prive)
const SENDER_INFO = {
  name: "Semzo Prive",
  address: "Calle Principal 123", // TODO: Configurar en settings
  city: "Madrid",
  postalCode: "28001",
  country: "ES",
}

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

    // Obtener datos de contacto del perfil (email, nombre para notificacion)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", reservation.user_id)
      .single()

    if (profileError || !profile) {
      console.error("[Logistics] Error getting profile:", profileError)
      return
    }

    // Obtener membresía desde user_memberships (FUENTE DE VERDAD)
    const { data: activeMembership } = await supabase
      .from("user_memberships")
      .select("id, membership_type, status")
      .eq("user_id", reservation.user_id)
      .in("status", ["active", "pending_delivery", "pending_verification", "paid_pending_verification"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeMembership?.status === "active") {
      console.log("[Logistics] Membresia ya activa, actualizando fecha de inicio por nueva entrega")
    }

    const planId = activeMembership?.membership_type || "signature"
    const durationDays = getMembershipDuration(planId)
    const now = new Date()
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Activar user_memberships (FUENTE DE VERDAD para membresía)
    if (activeMembership) {
      const { error: updateError } = await supabase
        .from("user_memberships")
        .update({
          status: "active",
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", activeMembership.id)

      if (updateError) {
        console.error("[Logistics] Error activating membership:", updateError)
        return
      }
    }

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
      reservations!shipments_reservation_id_fkey (
        id,
        start_date,
        end_date,
        profiles!reservations_user_id_fkey (
          full_name,
          email
        ),
        bags!reservations_bag_id_fkey (
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
 * Crear un nuevo envío - con integración de Correos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      reservation_id, 
      carrier = "Correos",
      tracking_number,
      estimated_delivery, 
      cost, 
      notes,
      // Datos del destinatario para Correos
      recipient_name,
      recipient_address,
      recipient_city,
      recipient_postal_code,
      recipient_country = "ES",
      recipient_phone,
      recipient_email,
      weight = 2000, // Default 2kg
      service_type = "PAQ_PREMIUM",
      use_correos_api = true
    } = body

    // Si se usa Correos API, validar dirección
    if (use_correos_api && carrier === "Correos") {
      if (!recipient_name || !recipient_address || !recipient_city || !recipient_postal_code) {
        return NextResponse.json({ error: "Dirección del destinatario incompleta" }, { status: 400 })
      }
    }

    let correosTrackingNumber = tracking_number
    let correosResponse = null
    let returnTrackingNumber = null
    let returnCorreosResponse = null

    // Intentar crear envío en Correos si está habilitado
    if (use_correos_api && carrier === "Correos") {
      // Obtener credenciales de Correos
      const { data: correosSettings } = await supabase
        .from("logistics_settings")
        .select("api_credentials, is_enabled")
        .eq("carrier_name", "Correos")
        .single()

      if (correosSettings?.api_credentials && correosSettings.is_enabled) {
        const { clientId, clientSecret } = correosSettings.api_credentials as {
          clientId: string
          clientSecret: string
        }

        const correosClient = new CorreosAPI({ clientId, clientSecret })
        const productCode = service_type === "PAQ_PREMIUM" 
          ? CORREOS_PRODUCTS.PAQ_PREMIUM 
          : CORREOS_PRODUCTS.PAQ_ESTANDAR

        // 1. Crear envío de IDA (Semzo -> Cliente)
        try {
          correosResponse = await correosClient.createShipment({
            senderName: SENDER_INFO.name,
            senderAddress: SENDER_INFO.address,
            senderCity: SENDER_INFO.city,
            senderPostalCode: SENDER_INFO.postalCode,
            senderCountry: SENDER_INFO.country,
            recipientName: recipient_name,
            recipientAddress: recipient_address,
            recipientCity: recipient_city,
            recipientPostalCode: recipient_postal_code,
            recipientCountry: recipient_country,
            recipientPhone: recipient_phone,
            recipientEmail: recipient_email,
            weight,
            productCode,
            reference: reservation_id ? `IDA-${reservation_id}` : `IDA-${Date.now()}`
          })
          correosTrackingNumber = correosResponse.codEnvio
        } catch (correosError) {
          console.error("[Logistics API] Error creating outbound Correos shipment:", correosError)
        }

        // 2. Crear envío de RETORNO (Cliente -> Semzo) - etiqueta prepagada
        try {
          returnCorreosResponse = await correosClient.createShipment({
            // Remitente = Cliente (quien devuelve)
            senderName: recipient_name,
            senderAddress: recipient_address,
            senderCity: recipient_city,
            senderPostalCode: recipient_postal_code,
            senderCountry: recipient_country,
            // Destinatario = Semzo Prive
            recipientName: SENDER_INFO.name,
            recipientAddress: SENDER_INFO.address,
            recipientCity: SENDER_INFO.city,
            recipientPostalCode: SENDER_INFO.postalCode,
            recipientCountry: SENDER_INFO.country,
            recipientPhone: "+34 900 000 000", // Telefono Semzo
            recipientEmail: "devoluciones@semzoprive.com",
            weight,
            productCode,
            reference: reservation_id ? `RET-${reservation_id}` : `RET-${Date.now()}`
          })
          returnTrackingNumber = returnCorreosResponse.codEnvio
        } catch (returnError) {
          console.error("[Logistics API] Error creating return Correos shipment:", returnError)
        }
      }
    }

    // Crear el envío en base de datos (con datos de ida y retorno)
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        reservation_id: reservation_id || null,
        status: correosTrackingNumber ? "label_created" : "pending",
        carrier,
        tracking_number: correosTrackingNumber || null,
        return_tracking_number: returnTrackingNumber || null, // Tracking de retorno
        estimated_delivery: estimated_delivery || null,
        cost: cost || null,
        notes: notes || null,
        recipient_name,
        recipient_address,
        recipient_city,
        recipient_postal_code,
        recipient_country,
        recipient_phone,
        recipient_email,
        weight,
        service_type: service_type === "PAQ_PREMIUM" ? "Paq Premium" : "Paq Estándar",
        correos_response: correosResponse,
        return_correos_response: returnCorreosResponse // Respuesta de Correos para retorno
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

    // Enviar notificación por email si hay tracking
    if (correosTrackingNumber && recipient_email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/api/admin/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipient_email,
            subject: "Tu pedido ha sido enviado - Semzo Prive",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a4b;">Tu pedido está en camino</h2>
                <p>Hola ${recipient_name},</p>
                <p>Tu pedido de Semzo Prive ha sido enviado.</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Transportista:</strong> Correos</p>
                  <p><strong>Número de seguimiento:</strong> ${correosTrackingNumber}</p>
                  <p><strong>Seguir envío:</strong> <a href="https://www.correos.es/es/es/herramientas/localizador/envios/${correosTrackingNumber}">Ver en Correos</a></p>
                </div>
                <p>Recibirás tu pedido en 1-2 días laborables.</p>
              </div>
            `,
          }),
        })
      } catch (emailError) {
        console.error("[Logistics API] Error sending tracking email:", emailError)
      }
    }

    return NextResponse.json({
      ...data,
      correos_success: !!correosTrackingNumber,
      return_label_created: !!returnTrackingNumber,
      return_tracking_number: returnTrackingNumber
    }, { status: 201 })
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
