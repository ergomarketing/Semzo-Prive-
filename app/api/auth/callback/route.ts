import { supabaseAdmin } from "@/app/lib/supabase-unified"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")
    const code = searchParams.get("code")

    console.log("[v0] Callback recibido:", { token_hash: !!token_hash, type, code: !!code })

    if (code) {
      const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code)

      if (error || !data.user) {
        console.log("[v0] Error en exchangeCodeForSession:", error)
        const errorUrl = new URL("/auth/login", origin)
        errorUrl.searchParams.set("error", "confirmation_failed")
        return NextResponse.redirect(errorUrl)
      }

      console.log("[v0] Usuario confirmado exitosamente:", {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at,
      })

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
        maxAge: 60 * 60 * 24 * 7,
      })

      return response
    }

    if (!token_hash || !type) {
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "invalid_link")
      return NextResponse.redirect(errorUrl)
    }

    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (error || !data.user) {
      console.log("[v0] Error en verifyOtp:", error)
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "confirmation_failed")
      return NextResponse.redirect(errorUrl)
    }

    console.log("[v0] Usuario confirmado con verifyOtp:", {
      userId: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at,
    })

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
