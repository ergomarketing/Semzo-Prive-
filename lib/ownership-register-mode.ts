/**
 * Registra el modo elegido por la socia (Descubre / Colecciona) para un bolso.
 * Lo usan la ruta /api/user/ownership-progress y el webhook de pases (la reserva
 * de un pase comprado se crea alli, asi que alli se registra tambien el modo).
 *
 * - Idempotente: si ya hay un registro activo para ese bolso, lo devuelve.
 * - Colecciona siempre pasa por startCollectProgress (unica via, libro de credito).
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { startCollectProgress, type StartCollectResult } from "@/lib/ownership-collect-start"

export type OwnershipMode = "discover" | "collect"

export type RegisterModeResult =
  | { ok: true; progress: Record<string, unknown>; reused: boolean; collect?: Extract<StartCollectResult, { ok: true }> }
  | { ok: false; status: number; code?: string; message: string }

export async function registerOwnershipMode(
  supabase: SupabaseClient,
  userId: string,
  bagId: string,
  mode: OwnershipMode,
): Promise<RegisterModeResult> {
  const { data: existing } = await supabase
    .from("ownership_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("bag_id", bagId)
    .eq("status", "active")
    .maybeSingle()

  if (existing && (mode === "discover" || existing.mode === "collect")) {
    return { ok: true, progress: existing, reused: true }
  }

  if (mode === "collect") {
    const result = await startCollectProgress(userId, bagId, { supabase })
    if (!result.ok) return { ok: false, status: result.status, code: result.code, message: result.message }
    return { ok: true, progress: result.progress, reused: false, collect: result }
  }

  const { data: created, error } = await supabase
    .from("ownership_progress")
    .insert({ user_id: userId, bag_id: bagId, mode, purchase_price: null, accumulated: 0, status: "active" })
    .select()
    .single()

  if (error || !created) {
    console.error("[v0] Error creating ownership_progress:", error)
    return { ok: false, status: 500, message: "Error al registrar el modo elegido" }
  }
  return { ok: true, progress: created, reused: false }
}
