import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Admin inventory API called")

    const { data: bags, error: bagsError } = await supabase.from("bags").select(`
        *,
        reservations(
          id,
          user_id,
          start_date,
          end_date,
          status,
          profiles(full_name, email)
        )
      `)

    if (bagsError) {
      console.log("[v0] Error fetching bags:", bagsError)
      return NextResponse.json({ error: "Error al cargar inventario" }, { status: 500 })
    }

    const { data: waitlist, error: waitlistError } = await supabase.from("waitlist").select("*").order("created_at")

    const processedInventory =
      bags?.map((bag) => {
        const activeReservation = bag.reservations?.find(
          (r: any) => r.status === "active" || r.status === "confirmed" || r.status === "preparing",
        )

        const bagWaitlist = waitlist?.filter((w: any) => w.bag_id === bag.id) || []

        return {
          id: bag.id,
          name: bag.name,
          brand: bag.brand,
          status: bag.status || "available",
          condition: bag.condition || "excellent",
          total_rentals: bag.reservations?.length || 0,
          current_renter: activeReservation?.profiles?.full_name,
          rented_until: activeReservation?.end_date,
          waiting_list: bagWaitlist.map((w: any) => ({
            id: w.id,
            customerEmail: w.email,
            customerName: w.email.split("@")[0],
            addedDate: w.created_at,
            notified: w.notified,
          })),
          last_maintenance: bag.last_maintenance,
          reservations: bag.reservations || [],
          membership_type: bag.membership_type,
          retail_price: bag.retail_price,
          daily_price: bag.daily_price,
          monthly_price: bag.monthly_price,
          price: bag.price,
          image_url: bag.image_url,
          images: bag.images,
          category: bag.category,
          description: bag.description,
        }
      }) || []

    const stats = {
      total: processedInventory.length,
      available: processedInventory.filter((b) => b.status === "available").length,
      rented: processedInventory.filter((b) => b.status === "rented").length,
      maintenance: processedInventory.filter((b) => b.status === "maintenance").length,
    }

    console.log("[v0] Inventory data processed:", { count: processedInventory.length, stats })

    return NextResponse.json({
      inventory: processedInventory,
      stats,
    })
  } catch (error) {
    console.error("[v0] Admin inventory API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { bagId, status } = body

    if (!bagId || !status) {
      return NextResponse.json({ error: "bagId y status son requeridos" }, { status: 400 })
    }

    if (!["available", "rented", "maintenance", "reserved"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    console.log(`[v0] Updating bag ${bagId} to status ${status}`)

    const { data, error } = await supabase
      .from("bags")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bagId)
      .select()

    if (error) {
      console.error("[v0] Error updating bag status:", error)
      return NextResponse.json({ error: "Error al actualizar el estado del bolso" }, { status: 500 })
    }

    if (status === "available") {
      const { data: waitlistEntries } = await supabase
        .from("waitlist")
        .select("*, bags(name)")
        .eq("bag_id", bagId)
        .eq("notified", false)
        .order("created_at")
        .limit(1)

      if (waitlistEntries && waitlistEntries.length > 0) {
        const entry = waitlistEntries[0]

        // Enviar notificación por email
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: entry.email,
              subject: `¡El bolso ${entry.bags.name} está disponible!`,
              message: `Hola,\n\nEl bolso ${entry.bags.name} que estabas esperando ahora está disponible para alquilar.\n\nVisita nuestra web para hacer tu reserva: ${process.env.NEXT_PUBLIC_SITE_URL}/magazine\n\nSaludos,\nSemzo Privé`,
            }),
          })

          // Marcar como notificado
          await supabase
            .from("waitlist")
            .update({ notified: true, notified_at: new Date().toISOString() })
            .eq("id", entry.id)

          console.log(`[v0] Notified waitlist user: ${entry.email}`)
        } catch (emailError) {
          console.error("[v0] Error sending notification email:", emailError)
        }
      }
    }

    console.log(`[v0] Bag ${bagId} status updated successfully to ${status}`)

    return NextResponse.json({ success: true, bag: data[0] })
  } catch (error) {
    console.error("[v0] PATCH inventory API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from("bags")
      .insert({
        name: body.name,
        brand: body.brand,
        description: body.description,
        membership_type: body.membership_type || "essentiel",
        price: body.price ? Number.parseFloat(body.price) : null,
        retail_price: body.retail_price ? Number.parseFloat(body.retail_price) : null,
        condition: body.condition || "excellent",
        status: body.status || "available",
        image_url: body.image_url,
        images: body.images || [],
        category: body.category,
        total_rentals: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating bag:", error)
      return NextResponse.json({ error: "Error al crear el bolso" }, { status: 500 })
    }

    try {
      const { adminNotifications } = await import("@/lib/admin-notifications")
      await adminNotifications.notifyNewBagAdded({
        bagName: data.name,
        brand: data.brand,
        membershipType: data.membership_type,
        addedBy: "Admin Panel",
      })
    } catch (notifError) {
      console.error("[v0] Error sending new bag notification:", notifError)
    }

    return NextResponse.json({ success: true, bag: data })
  } catch (error) {
    console.error("[v0] POST bag API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
