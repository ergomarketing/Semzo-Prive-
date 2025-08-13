import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function createUserProfile(userId: string, userData: any) {
  try {
    console.log("🔄 Creando perfil para usuario:", userId)

    const profileData = {
      id: userId,
      email: userData.email,
      full_name: userData.user_metadata?.full_name || "",
      first_name: userData.user_metadata?.first_name || "",
      last_name: userData.user_metadata?.last_name || "",
      phone: userData.user_metadata?.phone || "",
      membership_status: "free",
      is_active: true,
      email_confirmed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from("profiles").upsert(profileData, {
      onConflict: "id",
    })

    if (error) {
      console.error("❌ Error creando perfil:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Perfil creado exitosamente")
    return { success: true, data }
  } catch (error) {
    console.error("❌ Error inesperado creando perfil:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
