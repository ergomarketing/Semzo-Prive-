import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import { requireAdminAuth } from "@/lib/admin-auth"
import { getResendApiKey } from "@/lib/resend-api-key"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PAGE_SIZE = 1000
const MAX_PAGES = 20
const MAX_ATTEMPTS = 3

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * POST /api/admin/newsletter/cancel
 *
 * Body: { campaign_id: string }
 *
 * Cancela en Resend todos los emails programados (status "pending") de la
 * campaña y marca cada fila de email_logs como "failed" / "Cancelada por admin".
 */
export async function POST(request: Request) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  try {
    const { campaign_id } = await request.json()

    if (typeof campaign_id !== "string" || !UUID_RE.test(campaign_id)) {
      return NextResponse.json({ error: "campaign_id inválido" }, { status: 400 })
    }

    const resendApiKey = getResendApiKey()
    if (!resendApiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const pending: { id: string; resend_id: string | null }[] = []
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data, error } = await supabase
        .from("email_logs")
        .select("id, resend_id")
        .eq("email_type", "newsletter_campaign")
        .eq("status", "pending")
        .eq("metadata->>campaign_id", campaign_id)
        .order("created_at", { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error
      pending.push(...(data ?? []))
      if ((data?.length ?? 0) < PAGE_SIZE) break
    }

    if (pending.length === 0) {
      return NextResponse.json({ error: "No hay envíos pendientes para esta campaña" }, { status: 404 })
    }

    const resend = new Resend(resendApiKey)
    let cancelled = 0
    let failed = 0
    let lastError: string | null = null

    for (const row of pending) {
      if (!row.resend_id) {
        failed++
        lastError = "Envío sin resend_id"
        continue
      }

      let cancelError: { name?: string; message?: string } | null = null
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const { error } = await resend.emails.cancel(row.resend_id)
        cancelError = error
        if (!error || error.name !== "rate_limit_exceeded") break
        await sleep(600 * attempt)
      }

      if (cancelError) {
        console.error(`[newsletter/cancel] No se pudo cancelar ${row.resend_id}:`, cancelError)
        failed++
        lastError = cancelError.message ?? "Error al cancelar en Resend"
        continue
      }

      cancelled++
      await supabase
        .from("email_logs")
        .update({ status: "failed", error_message: "Cancelada por admin" })
        .eq("id", row.id)
    }

    return NextResponse.json({ success: failed === 0, cancelled, failed, error: failed ? lastError : undefined })
  } catch (error) {
    console.error("[newsletter/cancel] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cancelar la campaña" },
      { status: 500 },
    )
  }
}
