import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // DESHABILITADO: No enviar emails manuales para evitar duplicados
    // Supabase se encarga automáticamente del email de confirmación

    console.log("⚠️ Endpoint de email de bienvenida deshabilitado para evitar duplicados")

    return NextResponse.json({
      success: true,
      message: "Email de bienvenida deshabilitado - Supabase se encarga automáticamente",
    })
  } catch (error) {
    console.error("❌ Error en send-welcome:", error)
    return NextResponse.json({ success: false, error: "Endpoint deshabilitado" }, { status: 500 })
  }
}
