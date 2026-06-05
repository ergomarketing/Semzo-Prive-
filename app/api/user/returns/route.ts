import { NextResponse, type NextRequest } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

// Service-role client para escribir en shipments/returns (evita choques con RLS).
// La propiedad SIEMPRE se valida contra user.id antes de escribir.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const IN_PROGRESS = ["active", "overdue", "confirmed"]

/** Devuelve la reserva en curso del usuario + su shipment + devolucion pendiente (si la hay). */
async function getContext(userId: string) {
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, bag_id, status, end_date, bags(name, brand)")
    .eq("user_id", userId)
    .in("status", IN_PROGRESS)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!reservation) return { reservation: null, shipment: null, pendingReturn: null }

  const { data: shipment } = await admin
    .from("shipments")
    .select("id")
    .eq("reservation_id", reservation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let pendingReturn = null
  if (shipment) {
    const { data: ret } = await admin
      .from("returns")
      .select("id, status, return_carrier, notes, created_at")
      .eq("shipment_id", shipment.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    // Solo cuenta como "en curso" si aun no se ha cerrado (received/completed).
    if (ret && !["received", "completed"].includes(ret.status)) pendingReturn = ret
  }

  return { reservation, shipment, pendingReturn }
}

/** GET: estado de devolucion del bolso en curso. */
export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { reservation, pendingReturn } = await getContext(user.id)

    if (!reservation) {
      return NextResponse.json({ hasBag: false, hasPendingReturn: false })
    }

    // Direccion prerellenada para la recogida (desde el perfil de la socia).
    const { data: profile } = await admin
      .from("profiles")
      .select(
        "shipping_address, shipping_via_type, shipping_via_name, shipping_number, shipping_portal, shipping_floor, shipping_door, shipping_postal_code, shipping_city, shipping_province",
      )
      .eq("id", user.id)
      .maybeSingle()

    let defaultAddress = ""
    if (profile) {
      if (profile.shipping_address) {
        defaultAddress = [profile.shipping_address, profile.shipping_postal_code, profile.shipping_city]
          .filter(Boolean)
          .join(", ")
      } else {
        const street = [
          profile.shipping_via_type,
          profile.shipping_via_name,
          profile.shipping_number,
          profile.shipping_portal,
          profile.shipping_floor,
          profile.shipping_door,
        ]
          .filter(Boolean)
          .join(" ")
        defaultAddress = [street, profile.shipping_postal_code, profile.shipping_city, profile.shipping_province]
          .filter(Boolean)
          .join(", ")
      }
    }

    const bag = (reservation as any).bags
    return NextResponse.json({
      hasBag: true,
      reservationId: reservation.id,
      bagName: bag ? `${bag.brand} ${bag.name}` : "tu bolso",
      defaultAddress,
      hasPendingReturn: !!pendingReturn,
      pendingReturn: pendingReturn
        ? {
            method: pendingReturn.return_carrier,
            status: pendingReturn.status,
            requestedAt: pendingReturn.created_at,
          }
        : null,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}

/** POST: la socia solicita la devolucion (recogida a domicilio o entrega en punto). */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await request.json()
    const method = body.method as "pickup" | "dropoff"
    if (method !== "pickup" && method !== "dropoff") {
      return NextResponse.json({ error: "Metodo de devolucion no valido" }, { status: 400 })
    }

    const { reservation, shipment, pendingReturn } = await getContext(user.id)

    if (!reservation) {
      return NextResponse.json({ error: "No tienes ningun bolso pendiente de devolver" }, { status: 400 })
    }
    if (pendingReturn) {
      return NextResponse.json({ error: "Ya tienes una devolucion solicitada" }, { status: 409 })
    }

    // Asegurar shipment al que adjuntar la devolucion.
    let shipmentId = shipment?.id
    if (!shipmentId) {
      const { data: created, error: shipErr } = await admin
        .from("shipments")
        .insert({ reservation_id: reservation.id, status: "delivered" })
        .select("id")
        .single()
      if (shipErr || !created) {
        return NextResponse.json({ error: "No se pudo registrar el envio asociado" }, { status: 500 })
      }
      shipmentId = created.id
    }

    // Construir nota legible para logistica segun el metodo elegido.
    let notes = ""
    const shipmentUpdate: Record<string, any> = { return_date: new Date().toISOString() }

    if (method === "pickup") {
      const { pickupDate, pickupSlot, address } = body
      if (!pickupDate || !pickupSlot || !address) {
        return NextResponse.json({ error: "Faltan datos de la recogida" }, { status: 400 })
      }
      notes = `Recogida a domicilio | Fecha: ${pickupDate} | Franja: ${pickupSlot} | Direccion: ${address}`
      if (body.note) notes += ` | Nota: ${body.note}`
      shipmentUpdate.pickup_date = pickupDate
    } else {
      const tracking = body.tracking?.trim()
      notes = "Entrega en punto de mensajeria (etiqueta incluida en el paquete)"
      if (tracking) notes += ` | Tracking: ${tracking}`
      if (body.note) notes += ` | Nota: ${body.note}`
    }

    const { data: ret, error: retErr } = await admin
      .from("returns")
      .insert({
        shipment_id: shipmentId,
        reason: "socia_return",
        status: "pending",
        notes,
        return_carrier: method,
        return_tracking: method === "dropoff" ? body.tracking?.trim() || null : null,
      })
      .select("id")
      .single()

    if (retErr || !ret) {
      return NextResponse.json({ error: retErr?.message || "No se pudo crear la devolucion" }, { status: 500 })
    }

    await admin.from("shipments").update(shipmentUpdate).eq("id", shipmentId)

    // Aviso a logistica (no bloqueante: si falla el email, la devolucion ya quedo creada).
    try {
      await notifyLogistics({ user, reservation, method, notes, returnId: ret.id })
    } catch (e) {
      console.error("[v0] Fallo aviso devolucion a logistica:", e)
    }

    return NextResponse.json({
      success: true,
      returnId: ret.id,
      message:
        method === "pickup"
          ? "Recogida solicitada. Te confirmaremos el paso del mensajero."
          : "Devolucion registrada. Entrega el paquete con la etiqueta incluida.",
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}

/** Envia un email a logistica avisando de la solicitud de devolucion. */
async function notifyLogistics(args: {
  user: { id: string; email?: string | null }
  reservation: any
  method: "pickup" | "dropoff"
  notes: string
  returnId: string
}) {
  const apiKey = process.env.EMAIL_API_KEY
  if (!apiKey) return

  const to = process.env.LOGISTICS_EMAIL || "mailbox@semzoprive.com"
  const bag = args.reservation?.bags
  const bagLabel = bag ? `${bag.brand} ${bag.name}` : "Bolso"
  const methodLabel = args.method === "pickup" ? "Recogida a domicilio" : "Entrega en punto de mensajeria"

  const subject = `Nueva devolucion solicitada · ${bagLabel}`
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1a2e;line-height:1.6">
      <h2 style="margin:0 0 12px">Nueva solicitud de devolucion</h2>
      <p><strong>Bolso:</strong> ${bagLabel}</p>
      <p><strong>Socia:</strong> ${args.user.email || args.user.id}</p>
      <p><strong>Metodo:</strong> ${methodLabel}</p>
      <p><strong>Detalle:</strong> ${args.notes}</p>
      <p><strong>Reserva:</strong> ${args.reservation.id}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:16px">
        La reserva permanece en estado <strong>overdue</strong> hasta que registreis la recepcion
        del bolso en Logistica &gt; Devoluciones. Al marcarla como recibida se cerrara la reserva
        y se liberara el bolso automaticamente.
      </p>
    </div>`

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Semzo Privé <mailbox@semzoprive.com>",
      to: [to],
      reply_to: args.user.email || "soporte@semzoprive.com",
      subject,
      html,
      tags: [{ name: "category", value: "return_request" }],
    }),
  })
}
