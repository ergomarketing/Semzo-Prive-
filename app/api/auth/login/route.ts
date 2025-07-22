import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(url, anon)

    // 1. Autenticar --------------------------------------------------------
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (signInErr) return NextResponse.json({ success: false, message: signInErr.message })

    // 2. Obtener perfil ----------------------------------------------------
    const accessToken = signInData.session.access_token
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })

    const { data: profile, error: profErr } = await userClient
      .from("users")
      .select("*")
      .eq("id", signInData.user.id)
      .single()

    if (profErr || !profile) return NextResponse.json({ success: false, message: "Usuario no encontrado" })

    return NextResponse.json({ success: true, profile })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message })
  }
}
