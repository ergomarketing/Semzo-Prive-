import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { fetchSessionInvoice } from "@/lib/ownership-contract-archive"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/user/ownership/invoice?progress_id=...
 *
 * Lleva a la factura de Stripe de una compra Colecciona (pagina de la factura con descarga en PDF).
 * Solo su propietaria. La sesion de pago se localiza por la aceptacion del contrato, que la guarda.
 */
export async function GET(req: NextRequest) {
  try {
    const progressId = req.nextUrl.searchParams.get("progress_id")
    if (!progressId) return NextResponse.json({ error: "Falta progress_id" }, { status: 400 })

    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { data: contract } = await supabaseAdmin
      .from("colecciona_contracts")
      .select("stripe_session_id")
      .eq("ownership_progress_id", progressId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!contract?.stripe_session_id) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const invoice = await fetchSessionInvoice(contract.stripe_session_id)
    const url = invoice.invoiceUrl || invoice.invoicePdfUrl
    if (!url) {
      return NextResponse.json(
        { error: "Tu factura aún se está generando. Inténtalo de nuevo en unos minutos." },
        { status: 404 },
      )
    }
    return NextResponse.redirect(url)
  } catch (err) {
    console.error("[colecciona-invoice] error:", err)
    return NextResponse.json({ error: "Error al abrir la factura" }, { status: 500 })
  }
}
