import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message || "Error en registro" },
        { status: 400 }
      );
    }

    if (!authData?.user) {
      return NextResponse.json(
        { success: false, message: "No se pudo crear el usuario" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      membership_status: "free",
    });

    if (profileError) {
      return NextResponse.json(
        { success: false, message: profileError.message || "Error creando perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente.",
      user: {
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Error inesperado en el servidor" },
      { status: 500 }
    );
  }
}
