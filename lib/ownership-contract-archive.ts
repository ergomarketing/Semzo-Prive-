/**
 * Archivo del contrato firmado de una venta Colecciona.
 *
 * Tras confirmarse el pago: reconstruye el contrato EXACTO que la socia vio y acepto (las variables y el
 * sello de aceptacion —fecha, hora, IP— se guardaron en legal_acceptances antes de pagar), lo convierte en
 * PDF, lo guarda en un bucket privado con su huella SHA-256 y lo registra en colecciona_contracts.
 * Tambien recupera la factura que Stripe genero para el pago (enlace y PDF).
 *
 * Idempotente: si ya esta archivado, devuelve el PDF existente.
 */
import { createHash } from "crypto"
import Stripe from "stripe"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  COLECCIONA_CONTEXT_CONTRACT,
  COLECCIONA_CONTRACT_VERSION,
  buildContractBlocks,
  type AcceptanceStamp,
  type ContractVars,
} from "@/lib/colecciona-legal"
import { buildSimplePdf } from "@/lib/simple-pdf"

export const CONTRACT_BUCKET = "colecciona-contracts"

export interface ArchivedContract {
  pdf: Uint8Array
  filename: string
  storagePath: string
  sha256: string
  invoiceId: string | null
  invoiceUrl: string | null
  invoicePdfUrl: string | null
  alreadyArchived: boolean
}

export type ArchiveResult = { ok: true; archived: ArchivedContract } | { ok: false; reason: string }

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion })
}

/** Factura de Checkout (si Stripe ya la ha generado). Nunca lanza: sin factura no se bloquea nada. */
export async function fetchSessionInvoice(sessionId: string | null | undefined) {
  const empty = { invoiceId: null as string | null, invoiceUrl: null as string | null, invoicePdfUrl: null as string | null }
  if (!sessionId || !sessionId.startsWith("cs_")) return empty
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["invoice"] })
    const invoice = session.invoice as Stripe.Invoice | string | null
    if (!invoice || typeof invoice === "string") return { ...empty, invoiceId: typeof invoice === "string" ? invoice : null }
    return {
      invoiceId: invoice.id,
      invoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdfUrl: invoice.invoice_pdf ?? null,
    }
  } catch (err) {
    console.error("[colecciona-archive] No se pudo leer la factura de Stripe:", err)
    return empty
  }
}

export async function archiveColeccionaContract(
  supabase: SupabaseClient,
  input: { progressId: string; paymentRef: string },
): Promise<ArchiveResult> {
  const { data: progress } = await supabase
    .from("ownership_progress")
    .select("id, user_id, bag_id")
    .eq("id", input.progressId)
    .maybeSingle()
  if (!progress) return { ok: false, reason: "progress_not_found" }

  const invoice = await fetchSessionInvoice(input.paymentRef)

  // Ya archivado: se devuelve el PDF existente (para poder adjuntarlo de nuevo si hace falta).
  const { data: existing } = await supabase
    .from("colecciona_contracts")
    .select("storage_path, sha256")
    .eq("ownership_progress_id", progress.id)
    .maybeSingle()
  if (existing) {
    const { data: file } = await supabase.storage.from(CONTRACT_BUCKET).download(existing.storage_path)
    if (file) {
      const pdf = new Uint8Array(await file.arrayBuffer())
      return {
        ok: true,
        archived: {
          pdf,
          filename: "Contrato-Colecciona-SEMZO.pdf",
          storagePath: existing.storage_path,
          sha256: existing.sha256,
          alreadyArchived: true,
          ...invoice,
        },
      }
    }
  }

  // Aceptacion del contrato de ESTA compra: la que se guardo justo antes de pagar.
  let acceptanceId: string | null = null
  if (input.paymentRef.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(input.paymentRef)
      acceptanceId = session.metadata?.legal_acceptance_id ?? null
    } catch {
      acceptanceId = null
    }
  }
  let acceptanceQuery = supabase
    .from("legal_acceptances")
    .select("id, metadata")
    .eq("user_id", progress.user_id)
    .eq("context", COLECCIONA_CONTEXT_CONTRACT)
    .eq("reference_id", progress.id)
  acceptanceQuery = acceptanceId
    ? acceptanceQuery.eq("id", acceptanceId)
    : acceptanceQuery.order("accepted_at", { ascending: false }).limit(1)
  const { data: acceptances } = await acceptanceQuery
  const acceptance = acceptances?.[0]
  const vars = acceptance?.metadata?.vars as ContractVars | undefined
  const stamp = acceptance?.metadata?.stamp as AcceptanceStamp | undefined
  if (!acceptance || !vars || !stamp) return { ok: false, reason: "acceptance_not_found" }

  const pdf = buildSimplePdf(buildContractBlocks(vars, stamp), {
    title: `Contrato de compraventa Colecciona - ${vars.marca} ${vars.modelo}`,
    footer: `SEMZO PRIVÉ · Contrato Colecciona ${COLECCIONA_CONTRACT_VERSION} · ${vars.id_socia}`,
  })
  const sha256 = createHash("sha256").update(pdf).digest("hex")
  const storagePath = `${progress.user_id}/${progress.id}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(CONTRACT_BUCKET)
    .upload(storagePath, pdf, { contentType: "application/pdf", upsert: true })
  if (uploadError) return { ok: false, reason: `upload: ${uploadError.message}` }

  const { error: insertError } = await supabase.from("colecciona_contracts").upsert(
    {
      ownership_progress_id: progress.id,
      user_id: progress.user_id,
      bag_id: progress.bag_id,
      acceptance_id: acceptance.id,
      contract_version: COLECCIONA_CONTRACT_VERSION,
      storage_path: storagePath,
      sha256,
      size_bytes: pdf.length,
      stripe_session_id: input.paymentRef.startsWith("cs_") ? input.paymentRef : null,
      stripe_invoice_id: invoice.invoiceId,
    },
    { onConflict: "ownership_progress_id" },
  )
  if (insertError) return { ok: false, reason: `registro: ${insertError.message}` }

  return {
    ok: true,
    archived: {
      pdf,
      filename: "Contrato-Colecciona-SEMZO.pdf",
      storagePath,
      sha256,
      alreadyArchived: false,
      ...invoice,
    },
  }
}
