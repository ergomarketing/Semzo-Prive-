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
  // Verificar la sesión de administrador en localStorage (sistema de credenciales fijas)
  // Leer cookies de sesión de administrador (establecidas por la API de login)
  const adminToken = request.cookies.get("admin_session_token")?.value
  const adminEmail = request.cookies.get("admin_email")?.value

  let session = null
  // Si el token de admin existe, simular una sesión para el middleware
  if (adminToken === "valid_admin_token" && adminEmail) {
    session = { user: { email: adminEmail } }
  }

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
    "/cart", // Permitir acceso público al carrito para compras sin login
    "/admin/login", // Permitir acceso al login de admin
    "/legal/terms", // Permitir acceso a términos y condiciones
    "/legal/privacy", // Permitir acceso a política de privacidad
  ]

  const isAdminRoute = pathname.startsWith("/admin")
  const isApiRoute = pathname.startsWith("/api")

  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const isAuthRoute = pathname.startsWith("/auth/") || pathname === "/signup"

  // Proteger rutas de admin
  if (isAdminRoute && pathname !== "/admin/login") {
    if (!adminToken) {
      console.log("[Middleware] No session found for admin route, redirecting to /admin/login")
      // Eliminar cualquier cookie de admin por si acaso
      const response = NextResponse.redirect(new URL("/admin/login", request.url))
      response.cookies.delete("admin_session_token")
      response.cookies.delete("admin_email")
      return response
    }
    // Si el token existe, asumimos que es un admin válido.
  }

  if (isApiRoute) {
    return response
  }

  // Si no hay sesión y la ruta no es pública, redirigir a login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", request.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Si hay sesión de admin y está en ruta de auth, redirigir a /admin
  if (adminToken === "valid_admin_token" && isAuthRoute && pathname !== "/auth/callback") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Si hay sesión de usuario regular y está en ruta de auth, redirigir a /dashboard
  // Esto mantiene la lógica original de Supabase para usuarios regulares
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession()

  if (supabaseSession && isAuthRoute && pathname !== "/auth/callback") {
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
