/**
 * SCRIPT DE UN SOLO USO: credito retroactivo de Maria alba Hurtado Sanchez.
 *
 * Su progreso Colecciona activo se creo con accumulated=0 y nunca reclamo la factura
 * de alquiler ya pagada. Este script reclama esa factura en el libro
 * (ownership_credit_entries, source='rental_conversion') y suma su importe al progreso.
 *
 * USO (desde la raiz del proyecto, con las variables de entorno cargadas)
 *   npx tsx scripts/backfill-maria-alba-credit.ts            # DRY-RUN (no escribe nada)
 *   npx tsx scripts/backfill-maria-alba-credit.ts --apply    # aplica los cambios
 *
 * Idempotente: si la factura ya esta en el libro, no hace nada (tambien con --apply).
 */
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { addCreditToProgress, insertLedgerEntries } from "../lib/ownership-credit-ledger"

const EMAIL = "mariahurtadosanchez5@gmail.com"
const INVOICE_ID = "in_1UJLJdKBSKEgBoTnjBf7jnVP"
const EXPECTED_CENTS = 13950

const apply = process.argv.includes("--apply")
const tag = apply ? "[APPLY]" : "[DRY-RUN]"
const eur = (cents: number) => `${(cents / 100).toFixed(2)} EUR`

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  console.log(`${tag} Modo: ${apply ? "ESCRIBE en la base de datos" : "solo lectura, no se guarda nada"}`)

  const { data: profile } = await supabase.from("profiles").select("id, email, full_name").eq("email", EMAIL).maybeSingle()
  if (!profile) throw new Error(`No existe el perfil ${EMAIL}`)
  console.log(`${tag} Socia: ${profile.full_name} <${profile.email}> (${profile.id})`)

  const { data: existing, error: ledgerErr } = await supabase
    .from("ownership_credit_entries")
    .select("id, ownership_progress_id, source, amount_cents")
    .eq("stripe_invoice_id", INVOICE_ID)
    .maybeSingle()
  if (ledgerErr) throw new Error(`No se pudo leer el libro (¿existe ownership_credit_entries?): ${ledgerErr.message}`)
  if (existing) {
    console.log(
      `${tag} La factura ${INVOICE_ID} YA esta en el libro (progreso ${existing.ownership_progress_id}, ${existing.source}, ${eur(existing.amount_cents)}). No se hace nada.`,
    )
    return
  }

  const { data: actives } = await supabase
    .from("ownership_progress")
    .select("id, bag_id, accumulated, purchase_price, status, mode, started_at")
    .eq("user_id", profile.id)
    .eq("mode", "collect")
    .eq("status", "active")
  if (!actives || actives.length !== 1) {
    throw new Error(`Se esperaba exactamente 1 progreso collect activo y hay ${actives?.length ?? 0}. Abortado.`)
  }
  const progress = actives[0]
  const price = Number(progress.purchase_price)
  console.log(
    `${tag} Progreso collect activo: ${progress.id} (bolso ${progress.bag_id}), accumulated=${Number(progress.accumulated).toFixed(2)} EUR, precio=${price.toFixed(2)} EUR`,
  )

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("stripe_subscription_id")
    .eq("user_id", profile.id)
    .maybeSingle()
  const invoice = await stripe.invoices.retrieve(INVOICE_ID)
  const invoiceSub = (invoice as unknown as { subscription?: string | null }).subscription ?? null
  console.log(
    `${tag} Factura Stripe: status=${invoice.status}, amount_paid=${eur(invoice.amount_paid)}, suscripcion=${invoiceSub}`,
  )
  if (invoice.status !== "paid") throw new Error("La factura no esta pagada. Abortado.")
  if (invoice.amount_paid !== EXPECTED_CENTS) {
    throw new Error(`Importe inesperado: ${invoice.amount_paid} (esperado ${EXPECTED_CENTS}). Abortado.`)
  }
  if (!membership?.stripe_subscription_id || membership.stripe_subscription_id !== invoiceSub) {
    throw new Error("La factura no pertenece a la suscripcion actual de la socia. Abortado.")
  }

  const previous = Number(progress.accumulated || 0)
  const resulting = Math.round(Math.min(previous + invoice.amount_paid / 100, price) * 100) / 100
  console.log(`${tag} Se insertaria en el libro: ${INVOICE_ID}, ${eur(invoice.amount_paid)}, source='rental_conversion', progreso ${progress.id}`)
  console.log(`${tag} accumulated pasaria de ${previous.toFixed(2)} a ${resulting.toFixed(2)} EUR (status se queda 'active')`)

  if (!apply) {
    console.log(`${tag} Sin cambios. Vuelve a ejecutar con --apply para aplicarlo.`)
    return
  }

  const inserted = await insertLedgerEntries(supabase, [
    {
      ownership_progress_id: progress.id,
      user_id: profile.id,
      stripe_invoice_id: INVOICE_ID,
      amount_cents: invoice.amount_paid,
      source: "rental_conversion",
    },
  ])
  if (inserted.length === 0) {
    console.log(`${tag} Otra ejecucion reclamo la factura justo antes. No se suma credito.`)
    return
  }

  try {
    const result = await addCreditToProgress(supabase, progress.id, invoice.amount_paid / 100, price)
    console.log(`${tag} Hecho: accumulated ${result.previous.toFixed(2)} -> ${result.accumulated.toFixed(2)} EUR`)
  } catch (err) {
    await supabase.from("ownership_credit_entries").delete().eq("stripe_invoice_id", INVOICE_ID)
    throw new Error(`No se pudo actualizar accumulated; entrada del libro revertida: ${(err as Error).message}`)
  }
}

main().catch((err) => {
  console.error("ERROR:", err instanceof Error ? err.message : err)
  process.exit(1)
})
