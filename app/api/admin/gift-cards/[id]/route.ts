import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getServiceClient()
    const { status } = await request.json()

    const { data, error } = await supabase.from("gift_cards").update({ status }).eq("id", id).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ giftCard: data })
  } catch (error) {
    console.error("Error updating gift card:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getServiceClient()

    const { error } = await supabase.from("gift_cards").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting gift card:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
