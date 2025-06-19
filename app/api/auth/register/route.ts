import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json();

    console.log("Intentando registrar usuario:", email);

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("Error de autenticación:", authError);
      return NextResponse.json({
        success: false,
        message: authError.message,
      });
    }

    console.log("Usuario creado en Auth:", authData.user?.id);

    // Crear perfil de usuario
    if (authData.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        membership_status: "free",
      });

      if (profileError) {
        console.error("Error creando perfil:", {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        });

        return NextResponse.json({
          success: false,
          message: `Error creando perfil: ${profileError.message}`,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente. Revisa tu email para confirmar.",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
      },
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
    });
  }
}
