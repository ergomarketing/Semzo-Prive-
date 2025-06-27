import { supabase, type User, type AuthResponse } from "./supabase";

export class AuthServiceSupabase {
  static async loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
      // 1. Autenticación con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        console.error("Error de autenticación:", authError);
        return {
          success: false,
          message: this.getAuthErrorMessage(authError.message),
        };
      }

      // 2. Verificar/crear perfil en public.users
      const userResponse = await this.ensureUserProfile(authData.user);
      if (!userResponse.success) return userResponse;

      // 3. Guardar sesión
      localStorage.setItem("sb_session", JSON.stringify({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: Date.now() + (authData.session.expires_in * 1000)
      }));

      return {
        success: true,
        message: "Login exitoso",
        user: userResponse.user,
        session: authData.session,
      };
    } catch (error) {
      console.error("Error en login:", error);
      return {
        success: false,
        message: "Error interno del servidor",
      };
    }
  }

  private static async ensureUserProfile(authUser: any): Promise<AuthResponse> {
    try {
      // 1. Buscar usuario en public.users
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (existingUser) {
        return { success: true, user: existingUser };
      }

      // 2. Si no existe, crearlo
      const { data: newUser } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email,
          first_name: authUser.user_metadata?.first_name || "Usuario",
          last_name: authUser.user_metadata?.last_name || "Nuevo",
          phone: authUser.user_metadata?.phone || null,
          membership_status: "free",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { 
        success: true, 
        user: newUser 
      };
    } catch (error) {
      console.error("Error en perfil de usuario:", error);
      return {
        success: false,
        message: "Error al acceder al perfil de usuario",
      };
    }
  }

  private static getAuthErrorMessage(error: string): string {
    const messages: Record<string, string> = {
      "Invalid login credentials": "Email o contraseña incorrectos",
      "Email not confirmed": "Por favor verifica tu email primero",
      "Too many requests": "Demasiados intentos. Intenta más tarde",
    };
    return messages[error] || "Error al iniciar sesión";
  }

  //
}
