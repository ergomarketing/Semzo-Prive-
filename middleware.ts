import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Ejemplo: si TENÍAS una redirección forzando login, excluimos /cart y /api
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir siempre recursos estáticos y API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  // NO redirigir el carrito (que maneja auth client-side)
  if (pathname.startsWith('/cart')) {
    return NextResponse.next();
  }

  // SI QUIERES proteger otras rutas privadas podrías hacerlo aquí
  return NextResponse.next();
}
