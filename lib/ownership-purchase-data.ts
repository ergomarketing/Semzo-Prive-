/**
 * Datos de una compra Colecciona: socia, bolso, importes, ficha del estado y variables del
 * contrato. Lo usan la pantalla de compra (preview), el cobro (checkout) y el PDF, para que
 * todos trabajen con los MISMOS numeros y textos.
 *
 * Importes: precio - credito aplicado = importe final. Si el crédito cubre todo el precio se cobra
 * 1 € simbolico (getAmountDue) y el descuento es precio - 1 €.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { getAmountDue } from "@/lib/ownership-credit"
import {
  COLECCIONA_CONDITIONS_VERSION,
  COLECCIONA_CONTEXT_CONDITIONS,
  formatAmount,
  memberNumber,
  parseCompleteConditionReport,
  type ConditionReport,
  type ContractVars,
} from "@/lib/colecciona-legal"

export interface PurchaseContext {
  progress: { id: string; bag_id: string; accumulated: number; purchase_price: number }
  bag: {
    id: string
    brand: string
    name: string
    slug: string | null
    status: string
    reference: string
    images: string[]
    image_url: string | null
  }
  member: { id: string; full_name: string; email: string; document_number: string | null }
  amounts: { price: number; credit: number; due: number }
  report: ConditionReport | null
  conditionsAccepted: boolean
  vars: ContractVars
}

export type PurchaseContextResult =
  | { ok: true; context: PurchaseContext }
  | { ok: false; code: "no_active_collect" | "bag_not_found" | "member_not_found" | "price_missing"; message: string }

const round2 = (value: number) => Math.round(value * 100) / 100

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
}

export async function loadPurchaseContext(supabase: SupabaseClient, userId: string): Promise<PurchaseContextResult> {
  const { data: progress } = await supabase
    .from("ownership_progress")
    .select("id, bag_id, accumulated, purchase_price")
    .eq("user_id", userId)
    .eq("mode", "collect")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!progress) return { ok: false, code: "no_active_collect", message: "No hay compra en curso" }
  if (progress.purchase_price == null) return { ok: false, code: "price_missing", message: "Precio no disponible" }

  const { data: bag } = await supabase
    .from("bags")
    .select("id, brand, name, slug, status, nfc_uid, serial_number, images, image_url, condition_report")
    .eq("id", progress.bag_id)
    .maybeSingle()
  if (!bag) return { ok: false, code: "bag_not_found", message: "Bolso no encontrado" }

  const { data: member } = await supabase
    .from("profiles")
    .select("id, full_name, email, document_number, shipping_document_number")
    .eq("id", userId)
    .maybeSingle()
  if (!member) return { ok: false, code: "member_not_found", message: "Socia no encontrada" }

  const price = round2(Number(progress.purchase_price))
  const due = getAmountDue(Number(progress.accumulated || 0), price)
  const credit = round2(price - due)

  const report = parseCompleteConditionReport(bag.condition_report)

  const { data: accepted } = await supabase
    .from("legal_acceptances")
    .select("id")
    .eq("user_id", userId)
    .eq("context", COLECCIONA_CONTEXT_CONDITIONS)
    .eq("document_version", COLECCIONA_CONDITIONS_VERSION)
    .limit(1)
  const conditionsAccepted = !!accepted && accepted.length > 0

  const memberName = member.full_name || member.email
  // Los saltos de linea de la ficha no se ven en el PDF ni en una celda: se unen con "; ".
  const oneLine = (text: string | undefined) => (text ?? "").replace(/\s*[\r\n]+\s*/g, "; ").trim()
  const vars: ContractVars = {
    nombre_completo_socia: memberName,
    email_socia: member.email,
    id_socia: memberNumber(userId),
    marca: bag.brand || "",
    modelo: bag.name || "",
    referencia_nfc: bag.nfc_uid || bag.serial_number || "—",
    precio_venta: formatAmount(price),
    credito_aplicado: formatAmount(credit),
    importe_final: formatAmount(due),
    version_condiciones_colecciona: COLECCIONA_CONDITIONS_VERSION,
    estado_exterior: oneLine(report?.exterior),
    estado_esquinas: oneLine(report?.esquinas),
    estado_asas: oneLine(report?.asas),
    estado_herrajes: oneLine(report?.herrajes),
    estado_interior: oneLine(report?.interior),
    accesorios: oneLine(report?.accesorios),
    url_galeria_fotos: `${siteUrl()}/catalog/${bag.slug || bag.id}`,
  }

  return {
    ok: true,
    context: {
      progress: {
        id: progress.id,
        bag_id: progress.bag_id,
        accumulated: Number(progress.accumulated || 0),
        purchase_price: price,
      },
      bag: {
        id: bag.id,
        brand: bag.brand || "",
        name: bag.name || "",
        slug: bag.slug ?? null,
        status: bag.status,
        reference: vars.referencia_nfc,
        images: Array.isArray(bag.images) ? (bag.images as string[]).filter((u) => typeof u === "string") : [],
        image_url: bag.image_url ?? null,
      },
      member: {
        id: member.id,
        full_name: memberName,
        email: member.email,
        // El DNI/NIE de la ficha de envio ("Informacion de Envio") sirve igual si no hay otro guardado.
        document_number: member.document_number ?? member.shipping_document_number ?? null,
      },
      amounts: { price, credit, due },
      report,
      conditionsAccepted,
      vars,
    },
  }
}

/** "19 de octubre de 2026, 14:32 (hora de Madrid)" */
export function formatAcceptanceMoment(date = new Date()): string {
  const text = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(date)
  return `${text} (hora de Madrid)`
}
