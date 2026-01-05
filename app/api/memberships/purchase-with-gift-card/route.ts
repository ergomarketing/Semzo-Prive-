import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json()

    const cookieStore = cookies()
    const supabase = await createRouteHandlerClient({
      cookies: () => cookieStore,
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        membership_plan: planId,
        membership_status: "pending_verification",
      })
      .eq("id", user.id)

    if (error) {
      console.error("[v0] Error actualizando membresía:", error)
      return NextResponse.json({ error: "Error al actualizar membresía" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Membresía actualizada, procede con verificación de identidad",
    })
  } catch (error) {
    console.error("[v0] Error en purchase-with-gift-card:", error)
    return NextResponse.json({ error: "Error al procesar compra" }, { status: 500 })
  }
}
