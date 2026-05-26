import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const COOKIE_NAME = "catalog_unlocked"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, full_name, whatsapp, utm_source, utm_medium, utm_campaign } = body

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

    // Upsert por email (case insensitive)
    const { error } = await supabase.from("catalog_leads").upsert(
      {
        email: email.toLowerCase().trim(),
        full_name: full_name?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        source: "catalog_gate",
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        ip,
        user_agent: ua,
      },
      { onConflict: "email", ignoreDuplicates: false },
    )

    if (error) {
      console.error("[catalog-access] error guardando lead:", error)
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

    // Email de bienvenida (best-effort, no bloquea)
    try {
      const { sendCatalogAccessEmail } = await import("@/app/lib/email-service")
      // @ts-ignore — opcional, si la funcion no existe falla en silencio
      if (typeof sendCatalogAccessEmail === "function") {
        await sendCatalogAccessEmail({ to: email, name: full_name })
      }
    } catch (e) {
      // silencioso
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[catalog-access] error:", err)
    return NextResponse.json({ error: "Error procesando solicitud" }, { status: 500 })
  }
}
