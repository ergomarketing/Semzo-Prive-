import { supabase } from "@/lib/supabase-public";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function registerUser(email: string, password: string, name: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (authError || !authData?.user) {
    return { error: authError?.message || "Error creating user" };
  }

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    id: authData.user.id,
    email,
    name,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  return { user: authData.user };
}
