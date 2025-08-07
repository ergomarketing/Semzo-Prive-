import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone } = body

    console.log("[REGISTER] === INICIO REGISTRO ===")
    console.log("[REGISTER] Email:", email)

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: "Email, contraseña, nombre y apellido son requeridos" },
        { status: 400 }
      )
    }

    // Crear cliente admin de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser.users.find(u => u.email === email)

    if (userExists) {
      if (!userExists.email_confirmed_at) {
        // Usuario existe pero no confirmado - eliminarlo y crear nuevo
        await supabaseAdmin.auth.admin.deleteUser(userExists.id)
        console.log("[REGISTER] Usuario no confirmado eliminado")
      } else {
        return NextResponse.json(
          { success: false, message: "Ya existe un usuario con este email" },
          { status: 400 }
        )
      }
    }

    // Crear usuario en auth.users (el trigger automáticamente creará el perfil)
    console.log("[REGISTER] Creando usuario en auth.users...")
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: false,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        phone: phone || "",
      },
    })

    if (authError || !authData.user) {
      console.error("[REGISTER] Error creando usuario:", authError)
      return NextResponse.json(
        { success: false, message: authError?.message || "Error creando usuario" },
        { status: 400 }
      )
    }

    const userId = authData.user.id
    console.log("[REGISTER] ✅ Usuario creado en auth.users:", userId)

    // Generar link de confirmación usando generateLink
    console.log("[REGISTER] Generando link de confirmación...")
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: 'https://semzoprive.com/auth/callback'
      }
    })

    if (linkError || !linkData.properties?.action_link) {
      console.error("[REGISTER] Error generando link:", linkError)
      return NextResponse.json(
        { success: false, message: "Error generando link de confirmación" },
        { status: 500 }
      )
    }

    const confirmationUrl = linkData.properties.action_link
    console.log("[REGISTER] ✅ Link generado:", confirmationUrl)

    // Enviar email de bienvenida con el link correcto
    console.log("[REGISTER] Enviando email de bienvenida...")
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://semzoprive.com'}/api/emails/send-welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          firstName: firstName,
          confirmationUrl: confirmationUrl,
        }),
      })

      if (!emailResponse.ok) {
        console.warn("[REGISTER] ⚠️ Error enviando email")
      } else {
        console.log("[REGISTER] ✅ Email enviado")
      }
    } catch (emailError) {
      console.warn("[REGISTER] ⚠️ Error enviando email:", emailError)
    }

    console.log("[REGISTER] ✅ REGISTRO COMPLETADO")

    return NextResponse.json({
      success: true,
      message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
      user: {
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        membershipStatus: "free",
      },
    })
  } catch (error: any) {
    console.error("[REGISTER] ❌ Error inesperado:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
