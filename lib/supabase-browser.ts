import { getSupabaseBrowser as getSupabaseBrowserOriginal } from "./supabase"

export const getSupabaseBrowser = getSupabaseBrowserOriginal

export const createBrowserClient = getSupabaseBrowserOriginal

// Default export para compatibilidad
export default getSupabaseBrowserOriginal
