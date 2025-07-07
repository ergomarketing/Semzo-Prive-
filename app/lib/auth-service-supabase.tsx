import { supabase, type User, type AuthResponse } from "./supabase";

export class AuthServiceSupabase {
  static async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuario no creado en Auth');

      const { error: profileError } = await supabase
        .from('profiles')

        .insert({
          id: authData.user.id,
          email: userData.email.toLowerCase(),
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          membership_status: 'free'
        });

      if (profileError) throw profileError;

      const { data: sessionData } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      return {
        success: true,
        message: 'Registro exitoso',
        user: {
          id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          membership_status: 'free'
        },
        session: sessionData?.session
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en registro'
      };
    }
  }

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

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: "Usuario no encontrado. Por favor regístrate primero.",
        };
      }

      localStorage.setItem("sb_session", JSON.stringify({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      }));

      return {
        success: true,
        message: "Login exitoso",
        user: userData,
        session: authData.session,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Error interno del servidor",
      };
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const sessionStr = localStorage.getItem("sb_session");
      if (!sessionStr) return null;
      
      const session = JSON.parse(sessionStr);
      await supabase.auth.setSession(session);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      return userData;
    } catch (error) {
      return null;
    }
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem("sb_session");
  }

  static async isAuthenticated(): Promise<boolean> {
    const sessionStr = localStorage.getItem("sb_session");
    if (!sessionStr) return false;
    
    try {
      const session = JSON.parse(sessionStr);
      const { data: { user } } = await supabase.auth.getUser(session.access_token);
      return !!user;
    } catch (error) {
      return false;
    }
  }
}
