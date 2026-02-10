import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// ADMIN ENDPOINT - Only for development/testing
// Deletes user from both auth.users and public tables

export async function POST(request: Request) {
  console.log("[BACKEND] 🧹 CLEANUP USER - START")

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Use service_role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log("[BACKEND] 🔍 Looking for user with email:", email)

    // 1. Find user ID from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", email)

    if (authError) {
      console.error("[BACKEND] ❌ Error querying auth.users:", authError)
      // auth.users might not be accessible via RLS, try profiles instead
    }

    // 2. Find user ID from profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[BACKEND] ❌ Error querying profiles:", profileError)
    }

    const userId = profile?.id

    if (!userId) {
      console.log("[BACKEND] ℹ️ User not found in profiles")
      return NextResponse.json({ 
        message: "User not found in profiles. Check Supabase Dashboard → Authentication to delete from auth.users" 
      })
    }

    console.log("[BACKEND] 🎯 Found user ID:", userId)

    // 3. Delete from public tables (cascade should handle related records)
    const { error: deleteProfileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId)

    if (deleteProfileError) {
      console.error("[BACKEND] ❌ Error deleting profile:", deleteProfileError)
    } else {
      console.log("[BACKEND] ✅ Deleted from profiles")
    }

    // 4. Delete from membership_intents
    const { error: deleteIntentError } = await supabaseAdmin
      .from("membership_intents")
      .delete()
      .eq("user_id", userId)

    if (deleteIntentError) {
      console.error("[BACKEND] ⚠️ Error deleting membership_intents:", deleteIntentError)
    } else {
      console.log("[BACKEND] ✅ Deleted from membership_intents")
    }

    // 5. Delete from user_memberships
    const { error: deleteMembershipError } = await supabaseAdmin
      .from("user_memberships")
      .delete()
      .eq("user_id", userId)

    if (deleteMembershipError) {
      console.error("[BACKEND] ⚠️ Error deleting user_memberships:", deleteMembershipError)
    } else {
      console.log("[BACKEND] ✅ Deleted from user_memberships")
    }

    // 6. Delete from auth.users using Admin API
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteAuthError) {
      console.error("[BACKEND] ❌ Error deleting from auth.users:", deleteAuthError)
      return NextResponse.json({
        success: false,
        message: "Deleted from public tables but failed to delete from auth.users",
        error: deleteAuthError.message,
        hint: "Delete manually from Supabase Dashboard → Authentication → Users"
      }, { status: 500 })
    }

    console.log("[BACKEND] ✅ Deleted from auth.users")

    return NextResponse.json({
      success: true,
      message: "User completely deleted from all tables",
      user_id: userId,
      email: email
    })

  } catch (error: any) {
    console.error("[BACKEND] ❌ Cleanup error:", error.message)
    return NextResponse.json({ 
      error: "Cleanup failed", 
      details: error.message 
    }, { status: 500 })
  }
}
