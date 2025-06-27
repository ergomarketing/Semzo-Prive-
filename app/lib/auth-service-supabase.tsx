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
            last_name: userData.lastName,
            phone: userData.phone || ''
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se creó el usuario');

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email.toLowerCase(),
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          membership_status: 'free'
        });

      if (profileError) throw profileError;

      return {
        success: true,
        message: 'Registro exitoso',
        user: {
          id: authData.user.id,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          membership_status: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en el registro'
      };
    }
  }

  static async loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (authError) throw authError;

      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userData) {
        await supabase.from('users').insert({
          id: authData.user.id,
          email: authData.user.email,
          first_name: authData.user.user_metadata?.first_name || 'Usuario',
          last_name: authData.user.user_metadata?.last_name || 'Nuevo',
          membership_status: 'free'
        });
      }

      localStorage.setItem("sb_session", JSON.stringify({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token
      }));

      return {
        success: true,
        message: 'Login exitoso',
        user: userData,
        session: authData.session
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error en login'
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
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return userData;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem("sb_session");
  }
}
