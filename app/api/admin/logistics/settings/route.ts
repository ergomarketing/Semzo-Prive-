import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

/**
 * GET /api/admin/logistics/settings
 * Obtener configuración de transportistas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const carrier_name = searchParams.get("carrier_name")

    let query = supabase
      .from("logistics_settings")
      .select(
        `
      id,
      carrier_name,
      is_enabled,
      default_service,
      account_number,
      config_json,
      created_at,
      updated_at
    `
      )
      .order("carrier_name")

    if (carrier_name) {
      query = query.eq("carrier_name", carrier_name)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Logistics API] Error fetching settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * POST /api/admin/logistics/settings
 * Crear nueva configuración de transportista
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      carrier_name,
      api_key,
      account_number,
      default_service,
      webhook_url,
      webhook_secret,
      config_json,
    } = body

    if (!carrier_name) {
      return NextResponse.json(
        { error: "carrier_name is required" },
        { status: 400 }
      )
    }

    // Verificar que no existe ya
    const { data: existing } = await supabase
      .from("logistics_settings")
      .select("id")
      .eq("carrier_name", carrier_name)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Carrier already configured" },
        { status: 409 }
      )
    }

    // Crear la configuración
    const { data, error } = await supabase
      .from("logistics_settings")
      .insert({
        carrier_name,
        is_enabled: false, // Por defecto deshabilitado hasta que se valide
        api_key: api_key || null,
        account_number: account_number || null,
        default_service: default_service || null,
        webhook_url: webhook_url || null,
        webhook_secret: webhook_secret || null,
        config_json: config_json || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[Logistics API] Error creating settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "create_logistics_settings",
      entity_type: "settings",
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
 * PATCH /api/admin/logistics/settings
 * Actualizar configuración de transportista
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      is_enabled,
      api_key,
      account_number,
      default_service,
      webhook_url,
      webhook_secret,
      config_json,
    } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Obtener la configuración actual para auditoría
    const { data: oldData } = await supabase
      .from("logistics_settings")
      .select()
      .eq("id", id)
      .single()

    // Actualizar la configuración
    const { data, error } = await supabase
      .from("logistics_settings")
      .update({
        is_enabled: is_enabled !== undefined ? is_enabled : undefined,
        api_key: api_key !== undefined ? api_key : undefined,
        account_number: account_number !== undefined ? account_number : undefined,
        default_service: default_service !== undefined ? default_service : undefined,
        webhook_url: webhook_url !== undefined ? webhook_url : undefined,
        webhook_secret: webhook_secret !== undefined ? webhook_secret : undefined,
        config_json: config_json !== undefined ? config_json : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Logistics API] Error updating settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "update_logistics_settings",
      entity_type: "settings",
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

/**
 * DELETE /api/admin/logistics/settings
 * Eliminar configuración de transportista
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Obtener la configuración antes de eliminar
    const { data: oldData } = await supabase
      .from("logistics_settings")
      .select()
      .eq("id", id)
      .single()

    // Eliminar la configuración
    const { error } = await supabase
      .from("logistics_settings")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[Logistics API] Error deleting settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Registrar en auditoría
    await supabase.from("logistics_audit_log").insert({
      action: "delete_logistics_settings",
      entity_type: "settings",
      entity_id: id,
      old_values: oldData,
    })

    return NextResponse.json({ message: "Settings deleted" })
  } catch (error) {
    console.error("[Logistics API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
