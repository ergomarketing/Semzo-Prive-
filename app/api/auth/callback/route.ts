import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Error en callback:", error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        console.log("Usuario confirmado exitosamente:", data.user.email)
        // Redirigir al dashboard después de confirmar email
        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
      }
    } catch (error) {
      console.error("Error procesando callback:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=Error procesando confirmación`)
    }
  }

  // Si no hay código, redirigir al login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
