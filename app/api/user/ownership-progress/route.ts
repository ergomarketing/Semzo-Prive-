import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * POST /api/user/ownership-progress
 *
 * Crea (o devuelve si ya existe activo) el registro de modo elegido por
 * la socia para un bolso concreto.
 *
 * Body: { bag_id: string, mode: 'discover' | 'collect' }
 *
 * - mode='discover': sin precio de compra, sin acumulacion.
 * - mode='collect': se snapshotea bags.purchase_price como precio fijo.
 *
 * NO toca reservas. La reserva la sigue creando /api/user/reservations.
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase configuration")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { bag_id, mode } = body

    if (!bag_id || !mode || !["discover", "collect"].includes(mode)) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: bag_id y mode ('discover' | 'collect')" },
        { status: 400 },
      )
    }

    const supabase = getSupabase()

    // Idempotencia: si ya existe un registro activo para este user+bag, devolverlo
    const { data: existing } = await supabase
      .from("ownership_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("bag_id", bag_id)
      .eq("status", "active")
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, ownership_progress: existing, reused: true })
    }

    // Si modo collect: snapshot del precio del bolso
    let purchasePrice: number | null = null
    if (mode === "collect") {
      const { data: bag, error: bagErr } = await supabase
        .from("bags")
        .select("purchase_price")
        .eq("id", bag_id)
        .single()

      if (bagErr || !bag) {
        return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
      }

      if (bag.purchase_price == null || Number(bag.purchase_price) <= 0) {
        return NextResponse.json(
          { error: "Este bolso no esta disponible en modo Colecciona" },
          { status: 400 },
        )
      }

      purchasePrice = Number(bag.purchase_price)
    }

    const { data: created, error: insertErr } = await supabase
      .from("ownership_progress")
      .insert({
        user_id: userId,
        bag_id,
        mode,
        purchase_price: purchasePrice,
        accumulated: 0,
        status: "active",
      })
      .select()
      .single()

    if (insertErr) {
      console.error("[v0] Error creating ownership_progress:", insertErr)
      return NextResponse.json({ error: "Error al registrar el modo elegido" }, { status: 500 })
    }

    return NextResponse.json({ success: true, ownership_progress: created, reused: false })
  } catch (error) {
    console.error("[v0] Unexpected error in ownership-progress POST:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}

/**
 * GET /api/user/ownership-progress?bag_id=...
 *
 * Devuelve el progreso activo del usuario, opcionalmente filtrado por bag_id.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const bagId = request.nextUrl.searchParams.get("bag_id")
    const supabase = getSupabase()

    let query = supabase
      .from("ownership_progress")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (bagId) query = query.eq("bag_id", bagId)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message, items: [] }, { status: 500 })
    }

    return NextResponse.json({ success: true, items: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno", items: [] },
      { status: 500 },
    )
  }
}
