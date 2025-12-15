import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { pathname } = request.nextUrl

  // El admin usa su propio sistema de autenticación con localStorage
  if (pathname.startsWith("/admin")) {
    return response
  }

  const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si no hay variables de Supabase, permitir continuar sin autenticación
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    // If refresh token is invalid, clear cookies and continue
    console.log("[v0] Auth error in middleware, clearing cookies:", error)
    response.cookies.delete("sb-access-token")
    response.cookies.delete("sb-refresh-token")
  }

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/admin",
    "/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/reset", // Añadida ruta de reset
    "/auth/callback",
    "/api/auth/callback",
    "/catalog",
    "/about",
    "/contact",
    "/membership",
    "/cart",
    "/checkout",
    "/legal/terms",
    "/legal/privacy",
    "/legal/cookies",
    "/images",
    "/support",
    "/blog",
    "/magazine",
  ]

  const isApiRoute = pathname.startsWith("/api")
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const isAuthRoute = pathname.startsWith("/auth/") || pathname === "/signup"

  const isResetRoute = pathname === "/auth/reset" || pathname === "/auth/reset-password"

  if (isApiRoute) {
    return response
  }

  if (!user && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute && pathname !== "/auth/callback" && !isResetRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
