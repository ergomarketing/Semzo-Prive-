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

  console.log("[v0] Auth callback params:", { code: !!code, token_hash: !!token_hash, type, next, plan, origin })

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
      // Si no hay type, intentar con "signup" por defecto, luego "email" si falla
      const otpType = type || "signup"
      let result = await supabase.auth.verifyOtp({ token_hash, type: otpType })
      
      // Si falla con signup, intentar con email
      if (result.error && otpType === "signup") {
        result = await supabase.auth.verifyOtp({ token_hash, type: "email" })
      }
      
      error = result.error
      data = result.data
    }

    console.log("[v0] Auth result:", { error: error?.message, hasUser: !!data?.user })

    if (!error) {
      if (data.user) {
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
              await supabaseService.from("profiles").insert({
                id: data.user.id,
                email: data.user.email || "",
                full_name: fullName,
                first_name: parts[0] || "",
                last_name: parts.slice(1).join(" ") || "",
                membership_status: "free",
                email_confirmed: true,
                created_at: new Date().toISOString(),
              })
            } else {
              await supabaseService
                .from("profiles")
                .update({ email_confirmed: true, updated_at: new Date().toISOString() })
                .eq("id", data.user.id)
            }
          }
        } catch (syncError) {
          // No bloquear el flujo si falla
        }
      }

      // RESTAURAR CONTEXTO ORIGINAL: prioridad: next param > cookie > plan > cart > dashboard
      const returnUrl = cookieStore.get('checkout_return_url')?.value

      if (next) {
        // next tiene la URL original donde estaba el usuario (bolso, carrito, etc.)
        return NextResponse.redirect(new URL(next, request.url))
      } else if (returnUrl) {
        cookieStore.delete('checkout_return_url')
        return NextResponse.redirect(new URL(returnUrl, request.url))
      } else if (origin === "checkout" && plan) {
        return NextResponse.redirect(new URL(`/checkout?plan=${plan}`, request.url))
      } else {
        // Último recurso: ir al dashboard del usuario
        return NextResponse.redirect(new URL("/dashboard", request.url))
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
