import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  // Refrescar sesión si existe
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/register",
    "/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/callback",
    "/api/auth/callback",
    "/catalog",
    "/about",
    "/contact",
    "/membership",
    "/admin/login", // Permitir acceso al login de admin
  ]

  // No necesitan verificación de Supabase en el middleware
  const isAdminRoute = pathname.startsWith("/admin")

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const isAuthRoute = pathname.startsWith("/auth/") || pathname === "/signup"

  if (isAdminRoute) {
    return response
  }

  // Si no hay sesión y la ruta no es pública, redirigir a login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay sesión y está en ruta de auth, redirigir a dashboard
  if (session && isAuthRoute && pathname !== "/auth/callback") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
