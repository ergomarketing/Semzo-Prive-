import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json()

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    if (!url || !anon) return NextResponse.json({ success: false, message: "Env vars faltantes" })

    // 1.  Cliente público para crear cuenta -------------------------------
    const supabase = createClient(url, anon)

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (signUpErr) return NextResponse.json({ success: false, message: signUpErr.message })

    const { user, session } = signUpData
    if (!user || !session?.access_token)
      return NextResponse.json({ success: false, message: "Sesión ausente tras sign-up" })

    // 2.  Cliente con TOKEN del usuario (rol authenticated) ---------------
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    })

    const { error: insErr } = await userClient.from("users").insert({
      id: user.id,
      email: user.email,
      first_name: firstName?.trim() || null,
      last_name: lastName?.trim() || null,
      phone: phone?.trim() || null,
    })

    if (insErr) {
      // Limpieza: borra el auth.user creado si falla la inserción
      await supabase.auth.admin.deleteUser(user.id) // no falla si anon_key
      return NextResponse.json({ success: false, message: insErr.message })
    }

    return NextResponse.json({ success: true, message: "Cuenta creada" })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message })
  }
}
