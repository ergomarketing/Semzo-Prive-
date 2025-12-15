import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const plan = requestUrl.searchParams.get("plan")
  const origin = requestUrl.searchParams.get("origin")

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log("[v0] Email confirmado exitosamente")

      if (origin === "checkout" && plan) {
        return NextResponse.redirect(new URL(`/checkout?plan=${plan}`, request.url))
      } else if (next) {
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        return NextResponse.redirect(new URL("/auth/login?confirmed=true", request.url))
      }
    } else {
      console.error("[v0] Error confirmando email:", error)
      return NextResponse.redirect(
        new URL(
          `/auth/error?message=${encodeURIComponent("Error al confirmar email. El enlace puede haber expirado.")}`,
          request.url,
        ),
      )
    }
  }

  return NextResponse.redirect(
    new URL(`/auth/error?message=${encodeURIComponent("Enlace de confirmación inválido")}`, request.url),
  )
}
