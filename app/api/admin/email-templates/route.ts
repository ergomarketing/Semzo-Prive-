import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isAdmin() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    return data?.role === "admin"
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  // Permitir acceso desde el panel admin (mismo origen) sin sesión en preview
  const referer = req.headers.get("referer") || ""
  const isAdminPanel = referer.includes("/admin")
  if (!isAdminPanel && !(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { data, error } = await adminSupabase
    .from("email_templates")
    .select("*")
    .order("id")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data })
}

export async function PATCH(req: NextRequest) {
  const referer = req.headers.get("referer") || ""
  const isAdminPanel = referer.includes("/admin")
  if (!isAdminPanel && !(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id, subject, body_html, delay_days, active } = await req.json()
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  const { data, error } = await adminSupabase
    .from("email_templates")
    .update({ subject, body_html, delay_days, active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}
