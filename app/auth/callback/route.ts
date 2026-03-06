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
      // Marcar email como confirmado en profiles (no sobreescribir otros campos)
      if (data.user) {
        try {
          const { createClient } = await import("@supabase/supabase-js")
          const supabaseService = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
          )
          await supabaseService
            .from("profiles")
            .update({ email_confirmed: true, updated_at: new Date().toISOString() })
            .eq("id", data.user.id)
        } catch (syncError) {
          // No bloquear el flujo si falla
        }
      }

      // RESTAURAR CONTEXTO ORIGINAL: verificar returnUrl en cookies primero
      const returnUrl = cookieStore.get('checkout_return_url')?.value

      if (returnUrl) {
        cookieStore.delete('checkout_return_url')
        return NextResponse.redirect(new URL(returnUrl, request.url))
      } else if (origin === "checkout" && plan) {
        return NextResponse.redirect(new URL(`/checkout?plan=${plan}`, request.url))
      } else if (next) {
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        // Último recurso: ir al cart si hay items, sino dashboard
        return NextResponse.redirect(new URL("/cart", request.url))
      }
    } else {
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
