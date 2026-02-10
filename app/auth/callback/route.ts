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

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log("[v0] Email confirmado exitosamente, user:", data.user?.id)

      // Sincronizar profile después de confirmar email
      if (data.user) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.semzoprive.com'}/api/sync-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: data.user.user_metadata?.first_name || '',
              lastName: data.user.user_metadata?.last_name || '',
              phone: data.user.user_metadata?.phone || null,
            })
          })
          console.log("[v0] Profile synced after email confirmation")
        } catch (syncError) {
          console.error("[v0] Profile sync error (non-blocking):", syncError)
        }
      }

      // RESTAURAR CONTEXTO ORIGINAL: verificar returnUrl en cookies primero
      const returnUrl = cookieStore.get('checkout_return_url')?.value

      if (returnUrl) {
        console.log("[v0] Returning to saved checkout URL:", returnUrl)
        // Limpiar cookie
        cookieStore.delete('checkout_return_url')
        return NextResponse.redirect(new URL(returnUrl, request.url))
      } else if (origin === "checkout" && plan) {
        console.log("[v0] Returning to checkout with plan:", plan)
        return NextResponse.redirect(new URL(`/checkout?plan=${plan}`, request.url))
      } else if (next) {
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        // Último recurso: ir al cart si hay items, sino dashboard
        return NextResponse.redirect(new URL("/cart", request.url))
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
