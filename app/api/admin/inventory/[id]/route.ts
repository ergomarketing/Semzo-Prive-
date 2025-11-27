import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// PUT - Actualizar bolso
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bagId = params.id
    const body = await request.json()

    const updateData: Record<string, any> = {
      name: body.name,
      brand: body.brand,
      description: body.description,
      membership_type: body.membership_type,
      retail_price: body.retail_price ? Number.parseFloat(body.retail_price) : null,
      condition: body.condition,
      status: body.status,
      updated_at: new Date().toISOString(),
    }

    // Solo actualizar image_url si se proporciona
    if (body.image_url !== undefined && body.image_url !== "") {
      updateData.image_url = body.image_url
    }

    if (body.images !== undefined) {
      updateData.images = body.images
    }

    if (body.price !== undefined) {
      updateData.price = body.price ? Number.parseFloat(body.price) : null
    }

    if (body.category !== undefined) {
      updateData.category = body.category
    }

    const { data, error } = await supabase.from("bags").update(updateData).eq("id", bagId).select().single()

    if (error) {
      console.error("[v0] Error updating bag:", error)
      return NextResponse.json({ error: "Error al actualizar el bolso" }, { status: 500 })
    }

    return NextResponse.json({ success: true, bag: data })
  } catch (error) {
    console.error("[v0] PUT bag API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE - Eliminar bolso
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bagId = params.id

    const { data: activeReservations } = await supabase
      .from("reservations")
      .select("id")
      .eq("bag_id", bagId)
      .in("status", ["active", "confirmed", "preparing"])

    if (activeReservations && activeReservations.length > 0) {
      return NextResponse.json({ error: "No se puede eliminar un bolso con reservas activas" }, { status: 400 })
    }

    const { error } = await supabase.from("bags").delete().eq("id", bagId)

    if (error) {
      console.error("[v0] Error deleting bag:", error)
      return NextResponse.json({ error: "Error al eliminar el bolso" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] DELETE bag API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
