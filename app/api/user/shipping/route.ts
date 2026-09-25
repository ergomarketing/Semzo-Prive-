import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { adminNotifications } from "@/lib/admin-notifications"

// Estados de reserva en los que el bolso está en curso (enviado, en poder de la socia,
// o pendiente de devolución). Un cambio de dirección en este momento no se bloquea,
// pero se registra y se alerta al admin porque no hay razón legítima habitual para
// cambiar la dirección de entrega de un envío ya en marcha.
const IN_PROGRESS_RESERVATION_STATUSES = ["active", "confirmed", "overdue"]

const SHIPPING_FIELDS = [
  "shipping_first_name",
  "shipping_last_name_1",
  "shipping_last_name_2",
  "shipping_document_type",
  "shipping_document_number",
  "shipping_via_type",
  "shipping_via_name",
  "shipping_number",
  "shipping_portal",
  "shipping_floor",
  "shipping_door",
  "shipping_postal_code",
  "shipping_city",
  "shipping_province",
  "shipping_country",
  "shipping_phone",
] as const

// GET - Obtener información de envío del usuario
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const selectFields = [...SHIPPING_FIELDS, "shipping_address", "phone"].join(", ")

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(selectFields)
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching shipping info:", error)
      return NextResponse.json({ error: "Error al obtener información de envío" }, { status: 500 })
    }

    return NextResponse.json({ shipping: profile || null })
  } catch (error) {
    console.error("Error in GET /api/user/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT - Actualizar información de envío del usuario (campos estructurados Correos)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    // Construir update solo con los campos enviados (whitelist)
    const update: Record<string, any> = {}
    for (const key of SHIPPING_FIELDS) {
      if (body[key] !== undefined) {
        update[key] = body[key] === "" ? null : body[key]
      }
    }

    // Validación campos OBLIGATORIOS Correos
    const required = [
      "shipping_first_name",
      "shipping_last_name_1",
      "shipping_document_type",
      "shipping_document_number",
      "shipping_via_type",
      "shipping_via_name",
      "shipping_door",
      "shipping_postal_code",
      "shipping_city",
      "shipping_province",
      "shipping_phone",
    ]
    const missing = required.filter((k) => !update[k] || String(update[k]).trim() === "")
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Faltan campos obligatorios",
          missing,
        },
        { status: 400 },
      )
    }

    if (update.shipping_country == null) update.shipping_country = "España"

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Asegurar perfil
    const { data: profileCheck } = await supabase
      .from("profiles")
      .select([...SHIPPING_FIELDS, "first_name", "last_name", "email"].join(", "))
      .eq("id", user.id)
      .maybeSingle()

    if (!profileCheck) {
      const { error: insertError } = await supabaseAdmin.from("profiles").insert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        phone: user.user_metadata?.phone || "",
      })
      if (insertError) {
        console.error("Error creating profile:", insertError)
        return NextResponse.json({ error: "Error al crear el perfil del usuario" }, { status: 500 })
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id)
      .select(SHIPPING_FIELDS.join(", "))
      .maybeSingle()

    if (error) {
      console.error("Error updating shipping info:", error)
      return NextResponse.json({ error: "Error al actualizar información de envío" }, { status: 500 })
    }

    // Log del cambio de dirección + alerta si hay una reserva en curso (bolso enviado,
    // en poder de la socia, o pendiente de devolución). No bloquea el cambio, pero
    // nada queda en silencio: se registra siempre y se avisa al admin si aplica.
    try {
      const oldAddressChanged = profileCheck
        ? SHIPPING_FIELDS.some((k) => (profileCheck as any)[k] !== update[k] && update[k] !== undefined)
        : false

      if (profileCheck && oldAddressChanged) {
        const { data: activeReservation } = await supabaseAdmin
          .from("reservations")
          .select("id, status")
          .eq("user_id", user.id)
          .in("status", IN_PROGRESS_RESERVATION_STATUSES)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        const oldAddressSnapshot = Object.fromEntries(SHIPPING_FIELDS.map((k) => [k, (profileCheck as any)[k]]))

        await supabaseAdmin.from("shipping_address_change_log").insert({
          user_id: user.id,
          reservation_id: activeReservation?.id || null,
          flagged_for_review: !!activeReservation,
          old_address: oldAddressSnapshot,
          new_address: update,
        })

        if (activeReservation) {
          const userName = [(profileCheck as any).first_name, (profileCheck as any).last_name]
            .filter(Boolean)
            .join(" ")
          await adminNotifications.notifySuspiciousAddressChange({
            userName: userName || user.email || user.id,
            userEmail: (profileCheck as any).email || user.email || "",
            userId: user.id,
            reservationId: activeReservation.id,
            reservationStatus: activeReservation.status,
            oldAddress: `${oldAddressSnapshot.shipping_via_name || ""} ${oldAddressSnapshot.shipping_number || ""}, ${oldAddressSnapshot.shipping_city || ""}`,
            newAddress: `${update.shipping_via_name || oldAddressSnapshot.shipping_via_name || ""} ${update.shipping_number || oldAddressSnapshot.shipping_number || ""}, ${update.shipping_city || oldAddressSnapshot.shipping_city || ""}`,
          })
        }
      }
    } catch (logError) {
      // No bloquear la actualización de dirección si falla el log/alerta
      console.error("Error logging shipping address change:", logError)
    }

    return NextResponse.json({
      message: "Información de envío actualizada correctamente",
      shipping: data,
    })
  } catch (error) {
    console.error("Error in PUT /api/user/shipping:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
