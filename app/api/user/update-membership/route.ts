import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipType, paymentId } = await request.json()

    if (!userId || !membershipType || !paymentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let cleanMembershipType = membershipType.toLowerCase().replace(/^l'/, "").trim()

    if (cleanMembershipType.includes("essentiel")) {
      cleanMembershipType = "essentiel"
    } else if (cleanMembershipType.includes("signature")) {
      cleanMembershipType = "signature"
    } else if (cleanMembershipType.includes("prive") || cleanMembershipType.includes("privé")) {
      cleanMembershipType = "prive"
    }

    console.log("[v0] Updating membership - User:", userId, "Type:", cleanMembershipType, "Payment:", paymentId)

    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey =
      process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[v0] Missing Supabase credentials:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
      })
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30)

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        membership_status: "active",
        membership_type: cleanMembershipType,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (profileError) {
      console.error("[v0] Error updating profile:", profileError)
      return NextResponse.json({ error: "Failed to update membership" }, { status: 500 })
    }

    console.log("[v0] Membership updated successfully for user:", userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in update-membership API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
