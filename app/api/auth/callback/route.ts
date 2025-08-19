import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    console.log("[v0] Callback recibido:", { token_hash: !!token_hash, type })

    if (!token_hash || !type) {
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "invalid_link")
      return NextResponse.redirect(errorUrl)
    }

    const supabaseService = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabaseService.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    console.log("[v0] Resultado verifyOtp:", { success: !!data.user, error: error?.message })

    if (error || !data.user) {
      console.log("[v0] Error en confirmación:", error)
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "confirmation_failed")
      return NextResponse.redirect(errorUrl)
    }

    const { data: userData, error: updateError } = await supabaseService.auth.admin.updateUserById(data.user.id, {
      email_confirm: true,
    })

    console.log("[v0] Usuario confirmado:", { userId: data.user.id, email: data.user.email })

    if (data.session) {
      const response = NextResponse.redirect(new URL("/dashboard", origin))

      response.cookies.set("sb-access-token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.session.expires_in,
      })

      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
      })

      return response
    }

    const successUrl = new URL("/auth/login", origin)
    successUrl.searchParams.set("message", "email_confirmed")
    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.log("[v0] Error inesperado en callback:", error)
    const errorUrl = new URL("/auth/login", request.url)
    errorUrl.searchParams.set("error", "unexpected_error")
    return NextResponse.redirect(errorUrl)
  }
}
