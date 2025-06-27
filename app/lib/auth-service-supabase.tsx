import { supabase, type User, type AuthResponse } from "./supabase";

export class AuthServiceSupabase {
  static async loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        return {
          success: false,
          message: "Credenciales incorrectas. Verifica tu email y contraseña.",
        };
      }

      // Guardar toda la sesión en localStorage
      localStorage.setItem("sb_session", JSON.stringify({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: Date.now() + (authData.session.expires_in * 1000)
      }));

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      return {
        success: true,
        message: "Login exitoso",
        user: userData,
        session: authData.session,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error interno del servidor",
      };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const sessionStr = localStorage.getItem("sb_session");
    if (!sessionStr) return null;

    const { access_token } = JSON.parse(sessionStr);
    const { data: { user } } = await supabase.auth.getUser(access_token);

    if (!user) return null;

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return userData;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem("sb_session");
  }
}
