import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireAdminAuth } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

/** POST /api/admin/members/[id]/notes  { body } : añade una nota interna (la socia nunca la ve). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  const { id } = await params
  const { body } = (await request.json().catch(() => ({}))) as { body?: string }
  const text = (body || "").trim()
  if (!text) return NextResponse.json({ error: "La nota está vacía" }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: "La nota es demasiado larga" }, { status: 400 })

  const { data, error } = await supabase
    .from("member_notes")
    .insert({ user_id: id, body: text })
    .select("id, body, created_at")
    .single()
  if (error) {
    console.error("[admin/members/notes] insert:", error)
    return NextResponse.json({ error: "No se pudo guardar la nota" }, { status: 500 })
  }
  return NextResponse.json({ note: data })
}

/** DELETE /api/admin/members/[id]/notes?noteId=... : borra una nota. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdminAuth()
  if (authError) return authError
  const { id } = await params
  const noteId = request.nextUrl.searchParams.get("noteId")
  if (!noteId) return NextResponse.json({ error: "Falta la nota" }, { status: 400 })
  const { error } = await supabase.from("member_notes").delete().eq("id", noteId).eq("user_id", id)
  if (error) return NextResponse.json({ error: "No se pudo borrar la nota" }, { status: 500 })
  return NextResponse.json({ success: true })
}
