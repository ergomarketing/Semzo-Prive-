import { getSupabaseServer } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServer()

    if (!supabase) {
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
    }

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener pases disponibles del usuario
    const { data: passes, error } = await supabase
      .from("bag_passes")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "available")
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("purchased_at", { ascending: false })

    if (error) {
      console.error("Error fetching passes:", error)
      return NextResponse.json({ error: "Error al obtener pases" }, { status: 500 })
    }

    // Agrupar por tier
    const passesByTier = {
      lessentiel: passes?.filter((p) => p.pass_tier === "lessentiel").length || 0,
      signature: passes?.filter((p) => p.pass_tier === "signature").length || 0,
      prive: passes?.filter((p) => p.pass_tier === "prive").length || 0,
    }

    return NextResponse.json({
      passes: passes || [],
      passesByTier,
      totalAvailable: passes?.length || 0,
    })
  } catch (error) {
    console.error("Error getting available passes:", error)
    return NextResponse.json({ error: "Error al obtener pases" }, { status: 500 })
  }
}
