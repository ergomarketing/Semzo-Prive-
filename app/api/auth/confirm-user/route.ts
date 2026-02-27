export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Confirmar email directamente en auth.users
    const { data: user, error: userError } = await supabase.auth.admin.updateUserById(email, { email_confirm: true })

    if (userError) {
      // Buscar usuario por email y confirmar
      const { data: users } = await supabase.auth.admin.listUsers()
      const targetUser = users.users.find((u) => u.email === email)

      if (targetUser) {
        await supabase.auth.admin.updateUserById(targetUser.id, {
          email_confirm: true,
        })

        return Response.json({ success: true, message: "Usuario confirmado" })
      }
    }

    return Response.json({ success: true, message: "Usuario confirmado" })
  } catch (error) {
    return Response.json({ success: false, error: "Error confirmando usuario" })
  }
}
