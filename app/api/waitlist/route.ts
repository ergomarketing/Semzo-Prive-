import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { bag_name, user_name, user_email } = await request.json()

    if (!bag_name || !user_name || !user_email) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const { data: bags, error: searchError } = await supabase
      .from("bags")
      .select("id, name, waiting_list")
      .ilike("name", `%${bag_name}%`)
      .limit(1)

    if (searchError || !bags || bags.length === 0) {
      return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
    }

    const bag = bags[0]
    const currentWaitingList = bag.waiting_list || []

    const existingEntry = currentWaitingList.find((entry: any) => entry.user_email === user_email)

    if (existingEntry) {
      return NextResponse.json({ error: "Ya estás en la lista de espera para este bolso" }, { status: 409 })
    }

    const newEntry = {
      id: `w${Date.now()}`,
      user_name,
      user_email,
      added_date: new Date().toISOString(),
      notified: false,
    }

    const updatedWaitingList = [...currentWaitingList, newEntry]

    const { error: updateError } = await supabase
      .from("bags")
      .update({ waiting_list: updatedWaitingList })
      .eq("id", bag.id)

    if (updateError) {
      console.error("Error updating waiting list:", updateError)
      return NextResponse.json({ error: "Error al actualizar la lista de espera" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Te hemos añadido a la lista de espera",
      position: updatedWaitingList.length,
    })
  } catch (error) {
    console.error("Waitlist API error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
