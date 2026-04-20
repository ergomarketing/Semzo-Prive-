import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Vercel Cron - runs every 5 minutes
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log("[CRON] Unauthorized cleanup attempt")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  console.log("[CRON] Starting orphaned bags cleanup job")

  try {
    // 1. Find bags that are 'rented' or 'locked' with updated_at > 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: potentialOrphanedBags, error: fetchError } = await supabase
      .from("bags")
      .select("id, name, status, updated_at")
      .in("status", ["rented", "locked", "Rented", "Locked"])
      .lt("updated_at", fiveMinutesAgo)

    if (fetchError) {
      console.error("[CRON] Error fetching bags:", fetchError)
      return NextResponse.json({ error: "Failed to fetch bags" }, { status: 500 })
    }

    if (!potentialOrphanedBags || potentialOrphanedBags.length === 0) {
      console.log("[CRON] No orphaned bags found")
      return NextResponse.json({
        success: true,
        message: "No orphaned bags found",
        released: 0,
        duration: Date.now() - startTime,
      })
    }

    console.log(`[CRON] Found ${potentialOrphanedBags.length} potential orphaned bags`)

    // 2. For each bag, determine if it's truly orphaned.
    // REGLA IMPORTANTE: solo se libera un bolso si TUVO una reserva que caducó/canceló.
    // Si un bolso está "rented" y NUNCA tuvo reserva -> es bloqueo manual del admin, NO tocar.
    const orphanedBagIds: string[] = []

    for (const bag of potentialOrphanedBags) {
      // 2a. ¿Tiene reserva activa? Si sí, saltar (el bolso está en uso legítimo).
      const { data: activeReservation, error: activeError } = await supabase
        .from("reservations")
        .select("id, status, is_admin_rent")
        .eq("bag_id", bag.id)
        .in("status", ["confirmed", "active", "pending", "in_progress", "preparing"])
        .limit(1)
        .maybeSingle()

      if (activeError) {
        console.error(`[CRON] Error checking active reservation for bag ${bag.id}:`, activeError)
        continue
      }

      if (activeReservation) {
        console.log(`[CRON] Bag ${bag.id} (${bag.name}) has active reservation - skipping`)
        continue
      }

      // 2b. ¿Existe alguna reserva histórica (cualquier status) para este bolso?
      // Si NUNCA tuvo reserva => bloqueo manual del admin => NO liberar.
      const { count: totalReservations, error: countError } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("bag_id", bag.id)

      if (countError) {
        console.error(`[CRON] Error counting reservations for bag ${bag.id}:`, countError)
        continue
      }

      if (!totalReservations || totalReservations === 0) {
        console.log(`[CRON] Bag ${bag.id} (${bag.name}) has NO reservation history - admin-locked, skipping`)
        continue
      }

      // 2c. Tuvo reservas pero ninguna activa => realmente huérfano, liberar.
      orphanedBagIds.push(bag.id)
      console.log(
        `[CRON] Bag ${bag.id} (${bag.name}) is orphaned - status: ${bag.status}, history: ${totalReservations} reservations, none active`,
      )
    }

    if (orphanedBagIds.length === 0) {
      console.log("[CRON] All rented bags have active reservations")
      return NextResponse.json({
        success: true,
        message: "All rented bags have active reservations",
        checked: potentialOrphanedBags.length,
        released: 0,
        duration: Date.now() - startTime,
      })
    }

    // 3. Release orphaned bags to 'available'
    const { data: releasedBags, error: updateError } = await supabase
      .from("bags")
      .update({
        status: "available",
        updated_at: new Date().toISOString(),
      })
      .in("id", orphanedBagIds)
      .select("id, name")

    if (updateError) {
      console.error("[CRON] Error releasing bags:", updateError)
      return NextResponse.json({ error: "Failed to release bags" }, { status: 500 })
    }

    const releasedCount = releasedBags?.length || 0
    console.log(`[CRON] Released ${releasedCount} orphaned bag(s):`, releasedBags?.map((b) => b.name).join(", "))

    // 4. Log to admin_notifications for visibility
    if (releasedCount > 0) {
      await supabase.from("admin_notifications").insert({
        type: "cron_cleanup",
        title: "Bolsos huérfanos liberados",
        message: `Se liberaron ${releasedCount} bolso(s) que estaban bloqueados sin reserva activa: ${releasedBags?.map((b) => b.name).join(", ")}`,
        severity: "info",
        metadata: {
          released_bags: releasedBags,
          job_duration_ms: Date.now() - startTime,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Released ${releasedCount} orphaned bag(s)`,
      checked: potentialOrphanedBags.length,
      released: releasedCount,
      releasedBags: releasedBags?.map((b) => ({ id: b.id, name: b.name })),
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[CRON] Unexpected error in cleanup job:", error)
    return NextResponse.json(
      { error: "Unexpected error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
