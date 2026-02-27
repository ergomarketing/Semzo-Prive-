import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.SUPABASE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bagId, nfcUid } = body

    if (!bagId) {
      return NextResponse.json({ error: "bagId es requerido" }, { status: 400 })
    }

    // ACCIÓN: Asignar NFC (solo una vez)
    if (action === "assign") {
      if (!nfcUid) {
        return NextResponse.json({ error: "nfcUid es requerido" }, { status: 400 })
      }

      // Verificar si el bolso ya tiene NFC asignado
      const { data: existingBag } = await supabase.from("bags").select("nfc_uid").eq("id", bagId).single()

      if (existingBag?.nfc_uid) {
        return NextResponse.json({ error: "Este bolso ya tiene un NFC asignado" }, { status: 400 })
      }

      // Verificar si el NFC UID ya está en uso
      const { data: duplicateNfc } = await supabase.from("bags").select("id, name").eq("nfc_uid", nfcUid).single()

      if (duplicateNfc) {
        return NextResponse.json({ error: `Este NFC ya está asignado al bolso: ${duplicateNfc.name}` }, { status: 400 })
      }

      // Asignar el NFC
      const { data, error } = await supabase
        .from("bags")
        .update({
          nfc_uid: nfcUid,
          nfc_assigned_at: new Date().toISOString(),
          nfc_scan_count: 0,
        })
        .eq("id", bagId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error asignando NFC:", error)
        return NextResponse.json({ error: "Error al asignar NFC" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "NFC asignado correctamente",
        bag: data,
      })
    }

    // ACCIÓN: Escanear NFC (validación)
    if (action === "scan") {
      if (!nfcUid) {
        return NextResponse.json({ error: "nfcUid es requerido" }, { status: 400 })
      }

      // Obtener el bolso
      const { data: bag, error: fetchError } = await supabase.from("bags").select("*").eq("id", bagId).single()

      if (fetchError || !bag) {
        return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
      }

      // Verificar si el bolso tiene NFC asignado
      if (!bag.nfc_uid) {
        return NextResponse.json(
          {
            error: "Este bolso no tiene NFC asignado",
            needsAssignment: true,
          },
          { status: 400 },
        )
      }

      // Verificar si el UID coincide
      const isMatch = bag.nfc_uid === nfcUid

      if (!isMatch) {
        // Bloquear el bolso por discrepancia
        await supabase
          .from("bags")
          .update({
            nfc_blocked: true,
            nfc_blocked_reason: `UID escaneado (${nfcUid}) no coincide con el asignado (${bag.nfc_uid})`,
            nfc_last_scan: new Date().toISOString(),
          })
          .eq("id", bagId)

        return NextResponse.json(
          {
            success: false,
            match: false,
            message: "⚠️ ALERTA: El NFC no coincide. Bolso bloqueado.",
            expected: bag.nfc_uid,
            scanned: nfcUid,
            blocked: true,
          },
          { status: 200 },
        )
      }

      // NFC coincide - actualizar último escaneo y contador
      const { data: updatedBag, error: updateError } = await supabase
        .from("bags")
        .update({
          nfc_last_scan: new Date().toISOString(),
          nfc_scan_count: (bag.nfc_scan_count || 0) + 1,
        })
        .eq("id", bagId)
        .select()
        .single()

      if (updateError) {
        console.error("[v0] Error actualizando escaneo:", updateError)
      }

      return NextResponse.json({
        success: true,
        match: true,
        message: "✓ NFC verificado correctamente",
        bag: updatedBag,
      })
    }

    // ACCIÓN: Desbloquear bolso (admin)
    if (action === "unblock") {
      const { data, error } = await supabase
        .from("bags")
        .update({
          nfc_blocked: false,
          nfc_blocked_reason: null,
        })
        .eq("id", bagId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: "Error al desbloquear" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Bolso desbloqueado correctamente",
        bag: data,
      })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error en NFC API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
