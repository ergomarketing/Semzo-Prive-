import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  if (error) {
    console.error('Error en callback:', error, error_description)
    return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(error_description || error)}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error?message=No se recibió código de confirmación', request.url))
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Intercambiar el código por una sesión
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error intercambiando código:', exchangeError)
      return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(exchangeError.message)}`, request.url))
    }

    if (data.user) {
      console.log('Usuario confirmado exitosamente:', data.user.email)
      
      // Crear respuesta con redirección al dashboard
      const response = NextResponse.redirect(new URL('/dashboard', request.url))
      
      // Establecer cookies de sesión
      if (data.session) {
        response.cookies.set('supabase-access-token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 días
        })
        
        response.cookies.set('supabase-refresh-token', data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 días
        })
      }
      
      return response
    }

    return NextResponse.redirect(new URL('/auth/error?message=No se pudo confirmar el usuario', request.url))

  } catch (error) {
    console.error('Error en callback:', error)
    return NextResponse.redirect(new URL('/auth/error?message=Error interno del servidor', request.url))
  }
}
