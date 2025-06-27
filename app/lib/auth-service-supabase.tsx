import { supabase, type User, type AuthResponse } from "./supabase"

export class AuthServiceSupabase {
  // Registrar usuario (corregido)
  static async registerUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }): Promise<AuthResponse> {
    try {
      // 1. Verificar si el usuario ya existe
      const { data: existingUser, error: existingError } = await supabase
        .from("users")
        .select("email")
        .eq("email", userData.email.toLowerCase())
        .maybeSingle();

      if (existingError) {
        console.error("Error verificando usuario existente:", existingError);
      }

      if (existingUser) {
        return {
          success: false,
          message: "Este email ya está registrado. Intenta iniciar sesión.",
        }
      }

      // 2. Registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          // Opción crítica para mantener sesión
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        return {
          success: false,
          message: "Error al crear la cuenta: " + authError.message,
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: "Error al crear la cuenta: No se recibió información de usuario",
        }
      }

      // 3. Crear perfil de usuario en nuestra tabla
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user.id,
            email: userData.email.toLowerCase(),
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone || null,
            membership_status: "free",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error("❌ Error creando perfil:", {
          message: profileError.message,
          details: profileError.details,
          code: profileError.code
        });
        
        // Eliminar usuario de Auth si falla la creación del perfil
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        return {
          success: false,
          message: "Error al crear el perfil de usuario: " + profileError.message,
        }
      }

      console.log("✅ Perfil guardado correctamente:", profileData);

      // 4. Manejo crítico: Iniciar sesión automáticamente después del registro
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

      if (sessionError || !sessionData.session) {
        console.error("Error iniciando sesión después de registro:", sessionError);
        return {
          success: false,
          message: "Registro exitoso pero no se pudo iniciar sesión automáticamente",
          user: profileData as User,
        }
      }

      return {
        success: true,
        message: "Usuario registrado y sesión iniciada exitosamente",
        user: profileData as User,
        session: sessionData.session, // Sesión válida
      }
    } catch (error: any) {
      console.error("Error en registro:", error);
      return {
        success: false,
        message: "Error interno del servidor: " + error.message,
      }
    }
  }

  // Iniciar sesión (mejorado)
  static async loginUser(email: string, password: string): Promise<AuthResponse> {
    try {
      // 1. Autenticar con Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        console.error("Error en login:", authError);
        return {
          success: false,
          message: "Credenciales incorrectas. Verifica tu email y contraseña.",
        }
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          message: "Error al iniciar sesión: Sesión no creada",
        }
      }

      // 2. Obtener perfil del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: "Error al obtener datos del usuario: " + (userError?.message || "Usuario no encontrado"),
        }
      }

      // 3. Actualizar último login
      await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id);

      // 4. Guardar sesión en almacenamiento local
      localStorage.setItem("supabase.auth.token", JSON.stringify(authData.session));

      return {
        success: true,
        message: "Login exitoso",
        user: userData,
        session: authData.session,
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      return {
        success: false,
        message: "Error interno del servidor: " + error.message,
      }
    }
  }

  // Obtener usuario actual (mejorado)
  static async getCurrentUser(): Promise<User | null> {
    try {
      // 1. Verificar sesión en localStorage
      const sessionStr = localStorage.getItem("supabase.auth.token");
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        supabase.auth.setSession(session);
      }

      // 2. Obtener usuario de Supabase
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) console.error("Error obteniendo usuario de auth:", authError);
      if (!authUser) return null;

      // 3. Obtener datos del perfil
      const { data: userData, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) console.error("Error obteniendo perfil:", profileError);
      
      return userData;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      return null;
    }
  }

  // Cerrar sesión (mejorado)
  static async logout(): Promise<void> {
    try {
      // 1. Eliminar sesión de localStorage
      localStorage.removeItem("supabase.auth.token");
      
      // 2. Cerrar sesión en Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  }

  // Verificar si está autenticado (mejorado)
  static async isAuthenticated(): Promise<boolean> {
    try {
      // Verificar token en localStorage
      const sessionStr = localStorage.getItem("supabase.auth.token");
      if (!sessionStr) return false;
      
      const session = JSON.parse(sessionStr);
      
      // Verificar si el token es válido
      const { data: { user }, error } = await supabase.auth.getUser(session.access_token);
      
      return !!user && !error;
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      return false;
    }
  }
}
