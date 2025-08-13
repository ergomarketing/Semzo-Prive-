import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json(
      { error: "El email es requerido" },
      { status: 400 }
    )
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
    }
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Correo de confirmación enviado" })
}
