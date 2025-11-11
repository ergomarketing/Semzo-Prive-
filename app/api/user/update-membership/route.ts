import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipType, paymentId } = await request.json()

    if (!userId || !membershipType || !paymentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key para admin operations
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Cookie set intentado en Server Component - OK ignorar
            }
          },
        },
      },
    )

    // Actualizar el user metadata en auth.users (requiere service role)
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        membership_status: membershipType,
        payment_id: paymentId,
        membership_updated_at: new Date().toISOString(),
      },
    })

    if (error) {
      console.error("Error updating membership:", error)
      return NextResponse.json({ error: "Failed to update membership" }, { status: 500 })
    }

    // Actualizar el perfil en la tabla profiles
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      member_type: membershipType, // Usar member_type que existe en la tabla
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Error updating profile:", profileError)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in update-membership API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
