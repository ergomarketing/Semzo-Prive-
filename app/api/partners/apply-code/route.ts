import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { applyPartnerCode } from "@/lib/partners"

/**
 * POST /api/partners/apply-code
 * El cliente aplica un codigo de partner en checkout. No da descuento; solo
 * registra la atribucion para liquidar comision al partner mas adelante.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const code = typeof body?.code === "string" ? body.code : ""
    if (!code.trim()) {
      return NextResponse.json({ error: "Introduce un código" }, { status: 400 })
    }

    const result = await applyPartnerCode({
      userId: user.id,
      userEmail: user.email,
      code,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      partner: { business_name: result.partner.business_name, code: result.partner.code },
      message: "Código aplicado correctamente",
    })
  } catch (error) {
    console.error("[v0] apply-code error:", error)
    return NextResponse.json({ error: "Error al aplicar el código" }, { status: 500 })
  }
}
