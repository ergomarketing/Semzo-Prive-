import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const COOKIE_NAME = "catalog_unlocked"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, full_name, whatsapp, utm_source, utm_medium, utm_campaign, marketing_consent, locale } = body

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      null
    const ua = request.headers.get("user-agent") || null

    const normalizedEmail = email.toLowerCase().trim()

    // catalog_leads solo tiene un UNIQUE sobre lower(email) (scripts/catalog_leads_table.sql),
    // no sobre la columna email: un upsert con onConflict:"email" fallaba SIEMPRE y la
    // tabla quedaba vacia. Se hace select + update/insert (el email ya va en minusculas).
    const contact = {
      full_name: full_name?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      ip,
      user_agent: ua,
    }

    const { data: existing, error: selectError } = await supabase
      .from("catalog_leads")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    let error = selectError
    if (!selectError) {
      if (existing) {
        // Reenvio del formulario: solo se completan los datos que ahora si llegan.
        const updates = Object.fromEntries(Object.entries(contact).filter(([, v]) => v))
        if (Object.keys(updates).length > 0) {
          const res = await supabase.from("catalog_leads").update(updates).eq("id", existing.id)
          error = res.error
        }
      } else {
        const res = await supabase
          .from("catalog_leads")
          .insert({ email: normalizedEmail, source: "catalog_gate", ...contact })
        // 23505 = otra peticion lo inserto a la vez: el contacto ya existe, no es un fallo.
        error = res.error?.code === "23505" ? null : res.error
      }
    }

    if (error) {
      console.error("[catalog-access] error guardando lead:", error)
    }

    // Meter en el embudo de leads + alta inmediata en newsletter (best-effort)
    try {
      const { enrollLead } = await import("@/lib/leads/enroll")
      await enrollLead({
        email: email.toLowerCase().trim(),
        name: full_name?.trim() || undefined,
        phone: whatsapp?.trim() || undefined,
        source: "organic_web",
        utm_campaign: utm_campaign || undefined,
        utm_medium: utm_medium || undefined,
      })
    } catch (e) {
      console.error("[catalog-access] enrollLead error:", e)
    }

    // Klaviyo: perfil + evento "Catalog Access". Sin consentimiento de marketing en este formulario,
    // NO se suscribe a ninguna lista: solo queda registrado el perfil y su actividad.
    try {
      const { klaviyoTrack } = await import("@/lib/klaviyo")
      const [first, ...rest] = (full_name?.trim() || "").split(/\s+/)
      await klaviyoTrack({
        email: normalizedEmail,
        metric: "Catalog Access",
        properties: {
          source: "catalog_gate",
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
        },
        uniqueId: `catalog_access:${normalizedEmail}`,
        profile: { firstName: first || null, lastName: rest.join(" ") || null, phone: whatsapp?.trim() || null },
      })
    } catch {
      // nunca bloquea el acceso al catalogo
    }

    // Consentimiento de marketing: SOLO si marco la casilla (expresa, no premarcada). Se guarda la prueba
    // y se suscribe a la lista de Klaviyo; si no la marco, sigue entrando al catalogo sin marketing.
    if (marketing_consent === true) {
      try {
        const { recordMarketingConsent } = await import("@/lib/marketing-consent")
        const [first, ...rest] = (full_name?.trim() || "").split(/\s+/)
        await recordMarketingConsent(supabase, {
          email: normalizedEmail,
          source: "catalog_gate",
          locale,
          firstName: first || null,
          lastName: rest.join(" ") || null,
          request,
        })
      } catch (e) {
        console.error("[catalog-access] consentimiento de marketing:", e)
      }
    }

    // Set cookie de acceso
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, "1", {
      httpOnly: false, // que el cliente pueda leerla para no remontar el gate
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[catalog-access] error:", err)
    return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 })
  }
}
