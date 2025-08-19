import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")

    if (!token_hash || !type) {
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "invalid_link")
      return NextResponse.redirect(errorUrl)
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (error || !data.user) {
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "invalid_token")
      return NextResponse.redirect(errorUrl)
    }

    const loginUrl = new URL("/auth/login", origin)
    loginUrl.searchParams.set("message", "email_confirmed")
    return NextResponse.redirect(loginUrl)
  } catch (error) {
    const errorUrl = new URL("/auth/login", request.url)
    errorUrl.searchParams.set("error", "unexpected_error")
    return NextResponse.redirect(errorUrl)
  }
}
