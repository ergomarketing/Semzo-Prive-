import { getSupabaseBrowser } from "@/lib/supabase"

export async function addToWaitlist(userId: string, bagId: string): Promise<boolean> {
  if (!userId) {
    window.location.href = "/auth/login"
    return false
  }

  const supabase = getSupabaseBrowser()

  if (!supabase) {
    console.error("[v0] No supabase client available")
    return false
  }

  try {
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("user_id", userId)
      .eq("bag_id", bagId)
      .maybeSingle()

    if (existing) {
      console.log("[v0] User already in waitlist for this bag")
      return true
    }

    const { data: profile } = await supabase.from("profiles").select("email").eq("id", userId).single()

    const { error } = await supabase.from("waitlist").insert({
      user_id: userId,
      bag_id: bagId,
      email: profile?.email || "",
      notified: false,
    })

    if (error) {
      console.error("[v0] Error adding to waitlist:", error)
      return false
    }

    console.log("[v0] Successfully added to waitlist")
    return true
  } catch (error) {
    console.error("[v0] Error in addToWaitlist:", error)
    return false
  }
}
