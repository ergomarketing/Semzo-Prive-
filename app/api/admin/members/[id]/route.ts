import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { requireAdminAuth } from "@/lib/admin-auth"
import { getCreditBalanceCents } from "@/lib/ownership-credit-carry"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

/**
 * GET /api/admin/members/[id]
 * Ficha unica de una socia: contacto y envio, membresia, bolso actual, reservas, pagos (facturas de Stripe),
 * Colecciona, correos enviados y notas internas. Solo lectura; todo sale de las mismas tablas de siempre.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  const { id } = await params

  try {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle()
    if (!profile) return NextResponse.json({ error: "Socia no encontrada" }, { status: 404 })

    const [
      authResult,
      membershipsResult,
      identityResult,
      reservationsResult,
      emailsResult,
      notesResult,
      attributionResult,
      passesResult,
      progressResult,
      creditCents,
    ] = await Promise.all([
      supabase.auth.admin.getUserById(id),
      supabase.from("user_memberships").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(5),
      supabase
        .from("identity_verifications")
        .select("status, verified_at, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("reservations")
        .select("id, status, start_date, end_date, created_at, total_amount, membership_type, bags(name, brand, image_url)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
      profile.email
        ? supabase
            .from("email_logs")
            .select("id, subject, email_type, status, sent_at, created_at")
            .eq("recipient_email", profile.email)
            .order("created_at", { ascending: false })
            .limit(40)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("member_notes").select("id, body, created_at").eq("user_id", id).order("created_at", { ascending: false }),
      supabase.from("signup_attribution").select("channel, self_reported, created_at").eq("user_id", id).maybeSingle(),
      supabase.from("bag_passes").select("status").eq("user_id", id),
      supabase
        .from("ownership_progress")
        .select("id, status, mode, purchase_price, accumulated, created_at, bags(name, brand)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      getCreditBalanceCents(supabase, id).catch(() => 0),
    ])

    const memberships = membershipsResult.data || []
    const membership = memberships[0] || null

    // Envios de las reservas: seguimiento de Correos del bolso actual.
    const reservations = reservationsResult.data || []
    const reservationIds = reservations.map((r: any) => r.id)
    const { data: shipments } = reservationIds.length
      ? await supabase
          .from("shipments")
          .select("reservation_id, status, tracking_number, return_tracking_number, return_status")
          .in("reservation_id", reservationIds)
      : { data: [] as any[] }

    // Facturas reales de Stripe (importes y estado siempre correctos). Si Stripe falla, la ficha sigue.
    let invoices: Array<{ id: string; number: string | null; amount_paid: number; currency: string; status: string | null; created: number; url: string | null }> = []
    const customerId = membership?.stripe_customer_id || profile.stripe_customer_id || null
    if (customerId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
        const list = await stripe.invoices.list({ customer: customerId, limit: 20 })
        invoices = list.data.map((inv) => ({
          id: inv.id,
          number: inv.number,
          amount_paid: inv.amount_paid,
          currency: inv.currency,
          status: inv.status,
          created: inv.created,
          url: inv.hosted_invoice_url ?? null,
        }))
      } catch (err) {
        console.warn("[admin/members/ficha] Stripe no disponible:", err instanceof Error ? err.message : err)
      }
    }

    const passes = { available: 0, used: 0, expired: 0 }
    for (const pass of passesResult.data || []) {
      const key = pass.status as keyof typeof passes
      if (key in passes) passes[key] += 1
    }

    const authUser = authResult.data?.user
    return NextResponse.json({
      profile: {
        id: profile.id,
        name:
          profile.full_name ||
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          "Sin nombre",
        email: profile.email,
        phone: profile.shipping_phone || profile.phone || null,
        created_at: profile.created_at,
        document_type: profile.shipping_document_type || profile.document_type || null,
        document_number: profile.shipping_document_number || profile.document_number || null,
        shipping: {
          name: [profile.shipping_first_name, profile.shipping_last_name_1, profile.shipping_last_name_2]
            .filter(Boolean)
            .join(" "),
          address:
            profile.shipping_address ||
            [
              [profile.shipping_via_type, profile.shipping_via_name, profile.shipping_number].filter(Boolean).join(" "),
              profile.shipping_portal && `Portal ${profile.shipping_portal}`,
              profile.shipping_floor && `${profile.shipping_floor}º`,
              profile.shipping_door,
            ]
              .filter(Boolean)
              .join(", "),
          postal_code: profile.shipping_postal_code,
          city: profile.shipping_city,
          province: profile.shipping_province,
          country: profile.shipping_country,
        },
        stripe_customer_id: customerId,
        referral_balance: profile.referral_balance ?? 0,
      },
      account: {
        email_confirmed: !!authUser?.email_confirmed_at,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        provider: (authUser?.app_metadata as any)?.provider ?? profile.auth_method ?? null,
      },
      identity: identityResult.data
        ? { status: identityResult.data.status, verified_at: identityResult.data.verified_at }
        : { status: profile.identity_verified ? "verified" : "none", verified_at: profile.identity_verified_at },
      membership: membership && {
        type: membership.membership_type,
        status: membership.status,
        billing_cycle: membership.billing_cycle,
        start_date: membership.start_date,
        end_date: membership.end_date,
        current_period_end: membership.current_period_end,
        cancel_at_period_end: membership.cancel_at_period_end,
        past_due_since: membership.past_due_since,
        suspended_at: membership.suspended_at,
        failed_payment_count: membership.failed_payment_count,
        card: membership.payment_method_last4
          ? { brand: membership.payment_method_brand, last4: membership.payment_method_last4 }
          : null,
        stripe_subscription_id: membership.stripe_subscription_id,
      },
      passes,
      reservations: reservations.map((r: any) => {
        const bag = Array.isArray(r.bags) ? r.bags[0] : r.bags
        const shipment = (shipments || []).find((s: any) => s.reservation_id === r.id)
        return {
          id: r.id,
          status: r.status,
          start_date: r.start_date,
          end_date: r.end_date,
          bag: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "Bolso",
          tracking_number: shipment?.tracking_number ?? null,
          return_tracking_number: shipment?.return_tracking_number ?? null,
        }
      }),
      invoices,
      colecciona: {
        credit: Math.round(creditCents) / 100,
        progress: (progressResult.data || []).map((p: any) => {
          const bag = Array.isArray(p.bags) ? p.bags[0] : p.bags
          return {
            id: p.id,
            status: p.status,
            mode: p.mode,
            purchase_price: Number(p.purchase_price) || 0,
            accumulated: Number(p.accumulated) || 0,
            bag: bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "Bolso",
            created_at: p.created_at,
          }
        }),
      },
      emails: emailsResult.data || [],
      notes: notesResult.data || [],
      origin: attributionResult.data
        ? { channel: attributionResult.data.channel, self_reported: attributionResult.data.self_reported }
        : null,
    })
  } catch (error) {
    console.error("[admin/members/ficha] error:", error)
    return NextResponse.json({ error: "No se pudo cargar la ficha" }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/members/[id]
 * Borra la cuenta completa (perfil, acceso y datos asociados). Solo si no tiene pagos, reservas ni una membresia
 * viva: en ese caso la base de datos se niega y se explica por que. Stripe no se toca.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  const { id } = await params

  const { error } = await supabase.rpc("admin_delete_member_data", { p_user_id: id })
  if (error) {
    if (error.message?.includes("tiene_historial")) {
      return NextResponse.json(
        { error: "Esta socia tiene pagos, reservas o una membresía viva: no se puede borrar desde aquí." },
        { status: 409 },
      )
    }
    if (error.message?.includes("no_existe")) {
      return NextResponse.json({ error: "Socia no encontrada" }, { status: 404 })
    }
    console.error("[admin/members] borrado fallo:", error)
    return NextResponse.json({ error: "No se pudo borrar la cuenta" }, { status: 500 })
  }

  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id)
  if (authDeleteError) {
    console.error("[admin/members] no se pudo borrar el acceso:", authDeleteError)
    return NextResponse.json({ error: "Se borraron los datos pero no el acceso. Avisa para terminarlo." }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
