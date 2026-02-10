import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get("phone")

  if (!phone) {
    return NextResponse.json({ error: "Phone required" }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // 1. Buscar usuario por teléfono
    const { data: user } = await supabase.auth.admin.listUsers()
    const targetUser = user.users.find((u) => u.phone === phone)

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 2. Borrar registros relacionados
    await supabase.from("user_memberships").delete().eq("user_id", targetUser.id)
    await supabase.from("payment_methods").delete().eq("user_id", targetUser.id)
    await supabase.from("reservations").delete().eq("user_id", targetUser.id)

    // 3. Borrar usuario de auth
    await supabase.auth.admin.deleteUser(targetUser.id)

    return NextResponse.json({ success: true, deletedUserId: targetUser.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
