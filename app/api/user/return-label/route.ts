import { type NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { isCorreosProxyConfigured } from "@/lib/correos-api"
import { returnLabelPdfResponse } from "@/lib/return-label-pdf"

export const dynamic = "force-dynamic"

// Service-role para leer shipments; la propiedad se valida siempre contra user.id
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const IN_PROGRESS = ["active", "overdue", "confirmed"]

/**
 * GET /api/user/return-label
 *   ?info=1      -> JSON con lo necesario para pintar la tarjeta del panel (hay etiqueta o no, bolso, seguimiento)
 *   ?download=1  -> el PDF como descarga (sin esto se abre en la pestana)
 * La etiqueta es siempre la de la reserva en curso de la socia con sesion iniciada.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { data: reservation } = await admin
      .from("reservations")
      .select("id, bags(name, brand)")
      .eq("user_id", user.id)
      .in("status", IN_PROGRESS)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: shipment } = reservation
      ? await admin
          .from("shipments")
          .select("return_tracking_number, return_package_code, return_label_url, return_status")
          .eq("reservation_id", reservation.id)
          .not("return_tracking_number", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null }

    const hasLabel =
      !!reservation &&
      !!shipment &&
      shipment.return_status !== "delivered" &&
      (!!shipment.return_label_url || (!!shipment.return_package_code && isCorreosProxyConfigured()))

    if (req.nextUrl.searchParams.get("info")) {
      const bag = reservation ? (Array.isArray(reservation.bags) ? reservation.bags[0] : reservation.bags) : null
      return NextResponse.json({
        available: hasLabel,
        bagName: bag ? `${bag.brand} ${bag.name}` : null,
        trackingNumber: hasLabel ? shipment?.return_tracking_number ?? null : null,
      })
    }

    if (!hasLabel || !reservation) {
      return new NextResponse("No encontramos tu etiqueta. Escríbenos a info@semzoprive.com.", { status: 404 })
    }
    return returnLabelPdfResponse(reservation.id, { download: !!req.nextUrl.searchParams.get("download") })
  } catch (e) {
    console.error("[user/return-label] error:", e)
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
