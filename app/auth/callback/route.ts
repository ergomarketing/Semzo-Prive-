import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type") as "signup" | "recovery" | "email" | null
  const next = requestUrl.searchParams.get("next")
  const plan = requestUrl.searchParams.get("plan")
  const origin = requestUrl.searchParams.get("origin")

  if (code || token_hash) {
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

    // Manejar tanto code (PKCE flow) como token_hash (email confirmation flow)
    let error, data
    if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code)
      error = result.error
      data = result.data
    } else if (token_hash) {
      // type viene de Supabase en ConfirmationURL, default a "signup" si falta
      const otpType = type || "signup"
      const result = await supabase.auth.verifyOtp({ token_hash, type: otpType })
      error = result.error
      data = result.data
    }

    if (!error && data?.user) {
      // Autenticación exitosa - sincronizar perfil
      try {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const { createClient } = await import("@supabase/supabase-js")
          const supabaseService = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false } }
          )

          const { data: existingProfile } = await supabaseService
            .from("profiles")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle()

          if (!existingProfile) {
            const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ""
            const parts = fullName.split(" ")
            const { error: insertError } = await supabaseService.from("profiles").insert({
              id: data.user.id,
              email: data.user.email || "",
              full_name: fullName,
              first_name: parts[0] || "",
              last_name: parts.slice(1).join(" ") || "",
              membership_status: "free",
              email_confirmed: true,
              created_at: new Date().toISOString(),
            })
            // Error de perfil no bloquea el flujo
          } else {
            await supabaseService
              .from("profiles")
              .update({ email_confirmed: true, updated_at: new Date().toISOString() })
              .eq("id", data.user.id)
          }
        }
      } catch (syncError) {
        // Error de sync no bloquea el flujo
      }

      // Si hay next explícito en la URL (no perdido por Supabase), usarlo directamente
      if (next) {
        return NextResponse.redirect(new URL(next, request.url))
      }

      // Si viene de checkout con plan en la URL, ir al checkout
      if (origin === "checkout" && plan) {
        return NextResponse.redirect(new URL(`/checkout?plan=${plan}`, request.url))
      }

      // Redirigir a /auth/welcome que lee localStorage para recuperar el contexto original
      // (bolso que estaba viendo, carrito, etc.) guardado antes de confirmar el email
      return NextResponse.redirect(new URL("/auth/welcome", request.url))
    } else {
      // Si hubo error, asegurar que no haya sesión parcial
      await supabase.auth.signOut()
      
      const errorMessage = error?.message || "Error al confirmar email. El enlace puede haber expirado."
      return NextResponse.redirect(
        new URL(
          `/auth/error?message=${encodeURIComponent(errorMessage)}`,
          request.url,
        ),
      )
    }
  }

  return NextResponse.redirect(
    new URL(`/auth/error?message=${encodeURIComponent("Enlace de confirmacion invalido o parametros faltantes")}`, request.url),
  )
}
