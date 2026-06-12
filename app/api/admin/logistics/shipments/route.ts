import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { CorreosAPI, CORREOS_PRODUCTS, type CorreosParty } from "@/lib/correos-api"
import { sanitizeRecipient, type RecipientInput } from "@/lib/correos-sanitize"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Mapa de nombres de provincia → codigo de 2 digitos (Correos REST v1 requiere codigo numerico).
const PROVINCE_CODE_MAP: Record<string, string> = {
  ALAVA: "01", ALBACETE: "02", ALICANTE: "03", ALMERIA: "04", AVILA: "05",
  BADAJOZ: "06", "ILLES BALEARS": "07", BALEARES: "07", BARCELONA: "08",
  BURGOS: "09", CACERES: "10", CADIZ: "11", CASTELLON: "12", "CIUDAD REAL": "13",
  CORDOBA: "14", "A CORUÑA": "15", CORUÑA: "15", CUENCA: "16", GIRONA: "17",
  GRANADA: "18", GUADALAJARA: "19", GUIPUZCOA: "20", HUELVA: "21", HUESCA: "22",
  JAEN: "23", LEON: "24", LLEIDA: "25", RIOJA: "26", LUGO: "27", MADRID: "28",
  MALAGA: "29", MURCIA: "30", NAVARRA: "31", OURENSE: "32", ASTURIAS: "33",
  PALENCIA: "34", "LAS PALMAS": "35", PONTEVEDRA: "36", SALAMANCA: "37",
  "SANTA CRUZ DE TENERIFE": "38", TENERIFE: "38", CANTABRIA: "39", SEGOVIA: "40",
  SEVILLA: "41", SORIA: "42", TARRAGONA: "43", TERUEL: "44", TOLEDO: "45",
  VALENCIA: "46", VALLADOLID: "47", VIZCAYA: "48", ZAMORA: "49", ZARAGOZA: "50",
  CEUTA: "51", MELILLA: "52",
}

/** Resuelve el codigo de 2 digitos de provincia. Si ya viene como codigo lo devuelve tal cual. */
function resolveProvinceCode(province: string): string {
  if (!province) return ""
  // Si ya es un codigo de 1-2 digitos numericos, devolver con padding
  if (/^\d{1,2}$/.test(province.trim())) return province.trim().padStart(2, "0")
  return PROVINCE_CODE_MAP[province.trim().toUpperCase()] || province
}

// Default sender info (Semzo Prive). Fallback si logistics_settings.sender_info no esta configurado.
// country: "ESP" (ISO 3166 alfa-3 requerido por Correos REST v1, no "ES")
// province: codigo de 2 digitos (Correos REST v1 no acepta nombre libre)
const DEFAULT_SENDER_INFO = {
  name: "Semzo Prive",
  documentType: "NIF" as const,
  documentNumber: "",
  viaType: "CL",
  viaName: "TALES DE MILETO",
  number: "1",
  portal: "",
  floor: "2",
  door: "FW",
  postalCode: "29603",
  city: "MARBELLA",
  province: "29",
  country: "ESP",
  phone: "624239394",
  email: "info@semzoprive.com",
}

function buildSenderParty(senderInfo: any): CorreosParty {
  const s = senderInfo || DEFAULT_SENDER_INFO
  return {
    firstName: s.name || s.firstName || "Semzo Prive",
    lastName1: s.lastName1 || "",
    lastName2: s.lastName2 || "",
    documentType: s.documentType || "NIF",
    documentNumber: s.documentNumber || "",
    viaType: s.viaType || "CL",
    viaName: s.viaName || "",
    number: s.number || "",
    portal: s.portal || "",
    floor: s.floor || "",
    door: s.door || "",
    postalCode: s.postalCode || "",
    city: s.city || "",
    // Normalizar siempre a codigo de 2 digitos (Correos rechaza nombre libre)
    province: resolveProvinceCode(s.province || ""),
    // Normalizar a ISO alfa-3 (Correos rechaza "ES", espera "ESP")
    country: (s.country === "ES" ? "ESP" : s.country) || "ESP",
    phone: s.phone || "",
    email: s.email || "",
  }
}

function getMembershipDuration(planId: string): number {
  const durations: Record<string, number> = {
    petite: 7,
    signature: 30,
    "signature-quarterly": 90,
    infinite: 30,
    "infinite-quarterly": 90,
  }
  return durations[planId] || 30
}

async function activateMembershipOnDelivery(reservationId: string) {
  try {
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("user_id, bags(name, brand)")
      .eq("id", reservationId)
      .single()

    if (resError || !reservation) {
      console.error("[Logistics] Error getting reservation:", resError)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", reservation.user_id)
      .single()

    if (profileError || !profile) {
      console.error("[Logistics] Error getting profile:", profileError)
      return
    }

    const { data: activeMembership } = await supabase
      .from("user_memberships")
      .select("id, membership_type, status")
      .eq("user_id", reservation.user_id)
      .in("status", ["active", "pending_delivery", "pending_verification", "paid_pending_verification"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const planId = activeMembership?.membership_type || "signature"
    const durationDays = getMembershipDuration(planId)
    const now = new Date()
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    if (activeMembership) {
      await supabase
        .from("user_memberships")
        .update({
          status: "active",
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", activeMembership.id)
    }

    await supabase
      .from("reservations")
      .update({
        status: "active",
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", reservationId)

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          subject: "Tu bolso ha sido entregado. Tu membresia esta activa",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a4b;">Disfruta tu bolso</h2>
              <p>Hola ${profile.full_name || ""},</p>
              <p>Tu bolso ha sido entregado. A partir de ahora, tu membresia esta activa.</p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Inicio:</strong> ${now.toLocaleDateString("es-ES")}</p>
                <p><strong>Valida hasta:</strong> ${endDate.toLocaleDateString("es-ES")}</p>
              </div>
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
 * Construye el destinatario para Correos a partir del perfil estructurado de la reserva.
 * Si el body trae datos del destinatario explicitos, los usa preferentemente.
 */
async function resolveRecipient(
  reservationId: string | undefined,
  bodyRecipient: Partial<RecipientInput>,
): Promise<{ recipient: RecipientInput | null; error: string | null }> {
  // Si el cliente ya envia los campos estructurados (admin manual), usar tal cual
  const hasStructured =
    bodyRecipient.firstName && bodyRecipient.viaName && bodyRecipient.postalCode && bodyRecipient.city

  if (hasStructured) {
    return { recipient: bodyRecipient as RecipientInput, error: null }
  }

  if (!reservationId) {
    return { recipient: null, error: "Sin reservation_id ni datos estructurados de destinatario" }
  }

  // Obtener user_id de la reserva
  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .select("user_id")
    .eq("id", reservationId)
    .single()

  if (resError || !reservation) {
    return { recipient: null, error: "Reserva no encontrada" }
  }

  // Obtener datos estructurados del perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      email, full_name,
      shipping_first_name, shipping_last_name_1, shipping_last_name_2,
      shipping_document_type, shipping_document_number,
      shipping_via_type, shipping_via_name, shipping_number,
      shipping_portal, shipping_floor, shipping_door,
      shipping_postal_code, shipping_city, shipping_province,
      shipping_country, shipping_phone, phone
    `,
    )
    .eq("id", reservation.user_id)
    .single()

  if (profileError || !profile) {
    return { recipient: null, error: "Perfil del destinatario no encontrado" }
  }

  // Validar que la socia haya completado los datos estructurados
  if (!profile.shipping_first_name || !profile.shipping_via_name || !profile.shipping_door) {
    return {
      recipient: null,
      error:
        "La socia no ha completado los datos estructurados de envio. Pidele que actualice su direccion en el panel de socia.",
    }
  }

  return {
    recipient: {
      firstName: profile.shipping_first_name,
      lastName1: profile.shipping_last_name_1 || "",
      lastName2: profile.shipping_last_name_2 || "",
      documentType: (profile.shipping_document_type as any) || "DNI",
      documentNumber: profile.shipping_document_number || "",
      viaType: profile.shipping_via_type || "CL",
      viaName: profile.shipping_via_name,
      number: profile.shipping_number || "",
      portal: profile.shipping_portal || "",
      floor: profile.shipping_floor || "",
      door: profile.shipping_door,
      postalCode: profile.shipping_postal_code || "",
      city: profile.shipping_city || "",
      province: profile.shipping_province || "",
      country: profile.shipping_country || "ES",
      phone: profile.shipping_phone || profile.phone || "",
      email: profile.email || "",
    },
    error: null,
  }
}

/**
 * GET /api/admin/logistics/shipments
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
      return_tracking_number,
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

    if (status) query = query.eq("status", status)
    if (carrier) query = query.eq("carrier", carrier)

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("[Logistics API] Error fetching shipments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count, pages: Math.ceil((count || 0) / limit) },
    })
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/logistics/shipments
 * Crear envio integrado con Correos (ida + retorno prepagado).
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
      observations,
      weight = 2000,
      service_type = "PAQ_PREMIUM",
      use_correos_api = true,
      // Destinatario estructurado opcional (override del perfil)
      recipient,
    } = body

    let correosTrackingNumber = tracking_number
    let correosResponse: any = null
    let returnTrackingNumber: string | null = null
    let returnCorreosResponse: any = null
    let correosError: string | null = null
    let correosConfigured = false
    let correosEnabled = false
    let resolvedRecipient: RecipientInput | null = null

    if (use_correos_api && carrier === "Correos") {
      // 1. Resolver destinatario (desde perfil estructurado o body)
      const { recipient: rec, error: recError } = await resolveRecipient(reservation_id, recipient || {})
      if (recError || !rec) {
        return NextResponse.json({ error: recError || "Destinatario no resuelto" }, { status: 400 })
      }
      resolvedRecipient = rec

      // 2. Sanitizar destinatario contra reglas Correos
      const sanitized = sanitizeRecipient(rec)
      if (!sanitized.valid) {
        return NextResponse.json(
          { error: "Datos del destinatario invalidos", details: sanitized.errors },
          { status: 400 },
        )
      }
      const recipientParty: CorreosParty = sanitized.data

      // 3. Cargar datos del remitente y verificar que la integracion esta activa.
      //    Las credenciales OAuth y datos de cliente Correos los gestiona el
      //    proxy en VPS (variables de entorno CORREOS_PROXY_URL / CORREOS_PROXY_API_KEY).
      const { data: correosSettings } = await supabase
        .from("logistics_settings")
        .select("sender_info, is_enabled")
        .eq("carrier_name", "Correos")
        .single()

      const proxyConfigured = !!process.env.CORREOS_PROXY_URL && !!process.env.CORREOS_PROXY_API_KEY
      correosConfigured = proxyConfigured
      correosEnabled = !!correosSettings?.is_enabled

      if (!proxyConfigured) {
        correosError =
          "Proxy Correos no configurado: faltan CORREOS_PROXY_URL o CORREOS_PROXY_API_KEY"
      } else if (!correosEnabled) {
        correosError = "La integracion de Correos esta deshabilitada (is_enabled = false)"
      } else {
        const senderParty = buildSenderParty(correosSettings?.sender_info)

        const correosClient = new CorreosAPI()
        const isPremium = service_type === "PAQ_PREMIUM"
        // Producto de IDA (Semzo -> socia) y su producto de RETORNO emparejado
        const productCode = isPremium ? CORREOS_PRODUCTS.PAQ_PREMIUM : CORREOS_PRODUCTS.PAQ_ESTANDAR
        const returnProductCode = isPremium
          ? CORREOS_PRODUCTS.PAQ_RETORNO_PREMIUM
          : CORREOS_PRODUCTS.PAQ_RETORNO

        // Envio de IDA: Semzo -> Cliente
        try {
          correosResponse = await correosClient.createShipment({
            sender: senderParty,
            recipient: recipientParty,
            weight,
            productCode,
            reference: reservation_id ? `IDA-${reservation_id}` : `IDA-${Date.now()}`,
            observations,
          })
          correosTrackingNumber = correosResponse.codEnvio
        } catch (err: any) {
          const msg = err?.message || String(err)
          console.error("[Logistics API] Error creating outbound Correos shipment:", msg)
          correosError = `Correos rechazo el envio de IDA: ${msg}`
        }

        // Envio de RETORNO: Cliente -> Semzo (etiqueta prepagada)
        try {
          returnCorreosResponse = await correosClient.createShipment({
            sender: recipientParty,
            recipient: senderParty,
            weight,
            productCode: returnProductCode,
            admissionMethod: 3,
            deliveryMethod: "DOURUA",
            reference: reservation_id ? `RET-${reservation_id}` : `RET-${Date.now()}`,
            observations: "Devolucion bolso",
          })
          returnTrackingNumber = returnCorreosResponse.codEnvio
        } catch (err: any) {
          const msg = err?.message || String(err)
          console.error("[Logistics API] Error creating return Correos shipment:", msg)
          if (!correosError) correosError = `Correos rechazo la etiqueta de RETORNO: ${msg}`
        }
      }
    }

    // Persistir envio en BD
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        reservation_id: reservation_id || null,
        status: correosTrackingNumber ? "label_created" : "pending",
        carrier,
        tracking_number: correosTrackingNumber || null,
        return_tracking_number: returnTrackingNumber || null,
        estimated_delivery: estimated_delivery || null,
        cost: cost || null,
        notes: notes || null,
        recipient_name: resolvedRecipient
          ? `${resolvedRecipient.firstName} ${resolvedRecipient.lastName1 || ""} ${resolvedRecipient.lastName2 || ""}`.trim()
          : null,
        recipient_address: resolvedRecipient
          ? `${resolvedRecipient.viaType} ${resolvedRecipient.viaName} ${resolvedRecipient.number || ""}`.trim()
          : null,
        recipient_city: resolvedRecipient?.city || null,
        recipient_postal_code: resolvedRecipient?.postalCode || null,
        recipient_country: resolvedRecipient?.country || "ES",
        recipient_phone: resolvedRecipient?.phone || null,
        recipient_email: resolvedRecipient?.email || null,
        weight,
        service_type: service_type === "PAQ_PREMIUM" ? "Paq Premium" : "Paq Estandar",
        correos_response: correosResponse,
        return_correos_response: returnCorreosResponse,
      })
      .select()
      .single()

    if (error) {
      console.error("[Logistics API] Error creating shipment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from("logistics_audit_log").insert({
      action: "create_shipment",
      entity_type: "shipment",
      entity_id: data.id,
      new_values: data,
    })

    if (correosTrackingNumber && resolvedRecipient?.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/api/admin/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: resolvedRecipient.email,
            subject: "Tu pedido ha sido enviado - Semzo Prive",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1a4b;">Tu pedido esta en camino</h2>
                <p>Hola ${resolvedRecipient.firstName},</p>
                <p>Tu pedido de Semzo Prive ha sido enviado.</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Transportista:</strong> Correos</p>
                  <p><strong>Numero de seguimiento:</strong> ${correosTrackingNumber}</p>
                  <p><strong>Seguir envio:</strong> <a href="https://www.correos.es/es/es/herramientas/localizador/envios/${correosTrackingNumber}">Ver en Correos</a></p>
                </div>
              </div>
            `,
          }),
        })
      } catch (emailError) {
        console.error("[Logistics API] Error sending tracking email:", emailError)
      }
    }

    return NextResponse.json(
      {
        ...data,
        correos_success: !!correosTrackingNumber,
        correos_configured: correosConfigured,
        correos_enabled: correosEnabled,
        correos_error: correosError,
        return_label_created: !!returnTrackingNumber,
        return_tracking_number: returnTrackingNumber,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/logistics/shipments
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, carrier, tracking_number, estimated_delivery, cost, notes } = body

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const { data: oldData } = await supabase.from("shipments").select("*, reservation_id").eq("id", id).single()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status !== undefined) updateData.status = status
    if (carrier !== undefined) updateData.carrier = carrier
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number
    if (estimated_delivery !== undefined) updateData.estimated_delivery = estimated_delivery
    if (cost !== undefined) updateData.cost = cost
    if (notes !== undefined) updateData.notes = notes
    if (status === "delivered") updateData.actual_delivery = new Date().toISOString()

    const { data, error } = await supabase.from("shipments").update(updateData).eq("id", id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from("logistics_audit_log").insert({
      action: "update_shipment",
      entity_type: "shipment",
      entity_id: id,
      old_values: oldData,
      new_values: data,
    })

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
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const { data, error } = await supabase
      .from("shipments")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
