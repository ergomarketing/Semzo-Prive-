import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  console.log("[CALLBACK] === PROCESANDO CALLBACK ===")
  console.log("[CALLBACK] token_hash:", !!token_hash)
  console.log("[CALLBACK] type:", type)
  console.log("[CALLBACK] next:", next)

  if (token_hash && type) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      console.log("[CALLBACK] ✅ Email confirmado exitosamente")
      return NextResponse.redirect(`${origin}/dashboard`)
    } else {
      console.error("[CALLBACK] ❌ Error confirmando email:", error)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
    }
  }

  console.log("[CALLBACK] ❌ Parámetros inválidos o error en confirmación")
  return NextResponse.redirect(`${origin}/auth/error?message=invalid_parameters`)
}
