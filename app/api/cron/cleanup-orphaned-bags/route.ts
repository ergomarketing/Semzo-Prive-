import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Vercel Cron - runs every 5 minutes
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY!,
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

    // 2. For each bag, check if there's an active reservation
    const orphanedBagIds: string[] = []

    for (const bag of potentialOrphanedBags) {
      const { data: activeReservation, error: reservationError } = await supabase
        .from("reservations")
        .select("id, status")
        .eq("bag_id", bag.id)
        .in("status", ["confirmed", "active", "pending", "in_progress"])
        .limit(1)
        .maybeSingle()

      if (reservationError) {
        console.error(`[CRON] Error checking reservation for bag ${bag.id}:`, reservationError)
        continue
      }

      // If no active reservation, this bag is orphaned
      if (!activeReservation) {
        orphanedBagIds.push(bag.id)
        console.log(`[CRON] Bag ${bag.id} (${bag.name}) is orphaned - status: ${bag.status}, updated: ${bag.updated_at}`)
      }
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
