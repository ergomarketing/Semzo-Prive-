import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")
    const code = searchParams.get("code")

    console.log("[v0] 📨 Callback received:", { token_hash: !!token_hash, type, code: !!code })

    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error || !data.user) {
        console.log("[v0] ❌ Error in exchangeCodeForSession:", error?.message)
        const errorUrl = new URL("/auth/login", origin)
        errorUrl.searchParams.set("error", "confirmation_failed")
        return NextResponse.redirect(errorUrl)
      }

      console.log("[v0] ✅ User confirmed successfully:", {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at ? "✓" : "✗",
      })

      const successUrl = new URL("/dashboard", origin)
      return NextResponse.redirect(successUrl)
    }

    if (!token_hash || !type) {
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "invalid_link")
      return NextResponse.redirect(errorUrl)
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (error || !data.user) {
      console.log("[v0] ❌ Error in verifyOtp:", error?.message)
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "confirmation_failed")
      return NextResponse.redirect(errorUrl)
    }

    console.log("[v0] ✅ User confirmed with verifyOtp:", {
      userId: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at ? "✓" : "✗",
    })

    const successUrl = new URL("/auth/login", origin)
    successUrl.searchParams.set("message", "email_confirmed")
    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.log("[v0] ❌ Unexpected error in callback:", error)
    const errorUrl = new URL("/auth/login", request.url)
    errorUrl.searchParams.set("error", "unexpected_error")
    return NextResponse.redirect(errorUrl)
  }
}
