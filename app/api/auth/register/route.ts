import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  console.log("[REGISTER] ===== INICIO REGISTRO =====");

  // 1️⃣ Comprobar que las variables existen
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[REGISTER] URL:", url || "❌ FALTANTE");
  console.log("[REGISTER] AnonKey:", anonKey ? "✅ presente" : "❌ faltante");
  console.log("[REGISTER] ServiceKey:", serviceKey ? "✅ presente" : "❌ faltante");

  if (!url || !anonKey) {
    return NextResponse.json({ success: false, message: "Variables de entorno faltantes" }, { status: 500 });
  }

  // 2️⃣ Inicializar clientes
  const supabasePublic = createClient(url, anonKey);
  const supabaseAdmin = serviceKey ? createClient(url, serviceKey) : null;

  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    console.log("[REGISTER] Datos recibidos:", { email, firstName, lastName, phone });

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // 3️⃣ Verificar si el usuario ya existe (opcional)
    if (supabaseAdmin) {
      console.log("[REGISTER] Verificando usuario existente...");
      const { data: existing, error: checkErr } = await supabaseAdmin.auth.admin.getUserByEmail(email);
      if (checkErr) console.error("[REGISTER] Error verificando usuario:", checkErr.message);
      if (existing?.user) {
        console.log("[REGISTER] Usuario ya existe en Supabase Auth");
        return NextResponse.json(
          { success: false, message: "Usuario ya registrado" },
          { status: 400 }
        );
      }
    }

    // 4️⃣ Registrar usuario en Supabase
    console.log("[REGISTER] Ejecutando signUp()...");
    const { data, error } = await supabasePublic.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          phone: phone || "",
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    console.log("[REGISTER] Resultado signUp:", data, error);

    if (error) {
      console.error("[REGISTER] ❌ Error en signUp:", error.message);
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    if (!data.user) {
      console.error("[REGISTER] ❌ No se recibió usuario desde Supabase");
      return NextResponse.json({ success: false, message: "No se pudo crear el usuario" }, { status: 400 });
    }

    console.log("[REGISTER] ✅ Usuario registrado:", data.user.id);
    return NextResponse.json({
      success: true,
      message: "Registro exitoso, revisa tu email para confirmar la cuenta",
      userId: data.user.id
    });

  } catch (err: any) {
    console.error("[REGISTER] ❌ Error inesperado:", err);
    return NextResponse.json({ success: false, message: "Error interno del servidor" }, { status: 500 });
  }
}
