import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[SERVER] === INICIO REGISTRO ===")

    const body = await request.json()
    console.log("[SERVER] Datos recibidos:", body)

    const { email, firstName, lastName, phone } = body

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: "Email, nombre y apellido son requeridos" }, { status: 400 })
    }

    // Crear cliente admin de Supabase
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log("[SERVER] Cliente Supabase Admin creado")

    // Verificar si el usuario ya existe en auth
    console.log("[SERVER] Verificando si el usuario ya existe en auth...")
    const { data: existingAuthUser, error: authCheckError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (authCheckError && authCheckError.message !== "User not found") {
      console.error("[SERVER] Error verificando usuario en auth:", authCheckError)
      return NextResponse.json({ error: "Error verificando usuario existente" }, { status: 500 })
    }

    let userId: string
    const shouldSendConfirmation = true

    if (existingAuthUser?.user) {
      console.log("[SERVER] Usuario existente en auth: ✓ Encontrado")
      userId = existingAuthUser.user.id

      // Verificar si tiene perfil en public.users
      console.log("[SERVER] Verificando perfil existente en public.users...")
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[SERVER] Error verificando perfil:", profileError)
        return NextResponse.json({ error: "Error verificando perfil existente" }, { status: 500 })
      }

      if (existingProfile) {
        console.log("[SERVER] Usuario ya tiene perfil completo")
        return NextResponse.json(
          { message: "Usuario ya registrado. Si no has confirmado tu email, revisa tu bandeja de entrada." },
          { status: 200 },
        )
      }

      // Si el usuario existe en auth pero no tiene perfil, es un usuario huérfano
      console.log("[SERVER] Usuario huérfano detectado, eliminando de auth...")
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) {
        console.error("[SERVER] Error eliminando usuario huérfano:", deleteError)
      } else {
        console.log("[SERVER] Usuario huérfano eliminado exitosamente")
      }
    }

    // Crear nuevo usuario en auth
    console.log("[SERVER] Creando nuevo usuario en auth...")
    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // Requerir confirmación por email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    })

    if (signUpError) {
      console.error("[SERVER] Error creando usuario en auth:", signUpError)
      return NextResponse.json({ error: "Error creando usuario: " + signUpError.message }, { status: 400 })
    }

    if (!newUser.user) {
      console.error("[SERVER] No se pudo crear el usuario")
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }

    userId = newUser.user.id
    console.log("[SERVER] Usuario creado en auth:", userId)

    // Crear perfil en public.users
    console.log("[SERVER] Creando perfil en public.users...")
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      membership_status: "free",
      email_confirmed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("[SERVER] Error creando perfil:", profileError)
      // Si falla crear el perfil, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: "Error creando perfil de usuario" }, { status: 500 })
    }

    console.log("[SERVER] ✓ Perfil creado exitosamente")

    // Enviar email de confirmación
    console.log("[SERVER] Enviando email de confirmación...")
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (emailError) {
      console.error("[SERVER] Error enviando email de confirmación:", emailError)
      // No fallar el registro por esto, el usuario puede reenviar el email
    } else {
      console.log("[SERVER] ✓ Email de confirmación enviado")
    }

    console.log("[SERVER] === REGISTRO EXITOSO ===")
    return NextResponse.json({
      message: "Usuario registrado exitosamente. Revisa tu email para confirmar tu cuenta.",
      userId,
    })
  } catch (error) {
    console.error("[SERVER] Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
