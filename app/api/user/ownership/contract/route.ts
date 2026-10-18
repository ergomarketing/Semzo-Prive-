import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { CONTRACT_BUCKET, archiveColeccionaContract } from "@/lib/ownership-contract-archive"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * GET /api/user/ownership/contract?progress_id=...
 *
 * Descarga el contrato firmado (PDF) de una compra Colecciona. Solo su propietaria. Si por algun fallo
 * no se llego a archivar tras el pago, se genera ahora a partir de la aceptacion guardada.
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

    // La compra debe ser suya y estar completada
    const { data: progress } = await supabaseAdmin
      .from("ownership_progress")
      .select("id, user_id, status")
      .eq("id", progressId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!progress || progress.status !== "completed") {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 })
    }

    let { data: contract } = await supabaseAdmin
      .from("colecciona_contracts")
      .select("storage_path")
      .eq("ownership_progress_id", progress.id)
      .maybeSingle()

    if (!contract) {
      const archive = await archiveColeccionaContract(supabaseAdmin, { progressId: progress.id, paymentRef: "" })
      if (!archive.ok) {
        console.error("[colecciona-contract] No se pudo generar el contrato bajo demanda:", archive.reason)
        return NextResponse.json({ error: "El contrato aún no está disponible. Escríbenos a info@semzoprive.com." }, { status: 404 })
      }
      contract = { storage_path: archive.archived.storagePath }
    }

    const { data: signed, error } = await supabaseAdmin.storage
      .from(CONTRACT_BUCKET)
      .createSignedUrl(contract.storage_path, 60, { download: "Contrato-Colecciona-SEMZO.pdf" })
    if (error || !signed?.signedUrl) {
      return NextResponse.json({ error: "No se pudo preparar la descarga" }, { status: 500 })
    }
    return NextResponse.redirect(signed.signedUrl)
  } catch (err) {
    console.error("[colecciona-contract] error:", err)
    return NextResponse.json({ error: "Error al descargar el contrato" }, { status: 500 })
  }
}
