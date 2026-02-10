import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("waitlist").delete().eq("id", params.id)

    if (error) throw error

    console.log(`[v0] Waitlist entry ${params.id} deleted successfully`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting waitlist entry:", error)
    return NextResponse.json({ error: "Error al eliminar entrada" }, { status: 500 })
  }
}
