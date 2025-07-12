import { createBrowserSupabaseClient, type User } from "@supabase/auth-helpers-nextjs"

export const supabase = createBrowserSupabaseClient()

export type { User }
