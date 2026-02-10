import { createClient } from "@/app/lib/supabase/server"

interface ActivateMembershipParams {
  user_id: string
  intent_id: string
  verification_session_id?: string
  profile_data?: any
}

interface ActivationResult {
  success: boolean
  error?: string
  already_active?: boolean
  membership_type?: string
}

export async function activateMembership(params: ActivateMembershipParams): Promise<ActivationResult> {
  console.log("[v0] 🎯 ACTIVATION ORCHESTRATOR - START")

  const { user_id, intent_id, verification_session_id, profile_data } = params

  if (!user_id || !intent_id) {
    console.log("[v0] ❌ Missing required fields:", { user_id, intent_id })
    return { success: false, error: "Missing user_id or intent_id" }
  }

  const supabase = await createClient()

  try {
    // ========================================
    // PASO 1: VERIFICAR ESTADO ACTUAL (IDEMPOTENCIA)
    // ========================================
    const { data: intent, error: intentError } = await supabase
      .from("membership_intents")
      .select("id, status, membership_type, billing_cycle, user_id, profile_data")
      .eq("id", intent_id)
      .eq("user_id", user_id)
      .single()

    if (intentError || !intent) {
      console.log("[v0] ❌ Intent not found:", intentError)
      return { success: false, error: "Intent not found" }
    }

    // Si ya está activo, retornar éxito (idempotencia)
    if (intent.status === "active") {
      console.log("[v0] ✅ Intent already active - IDEMPOTENT RETURN")
      return {
        success: true,
        already_active: true,
        membership_type: intent.membership_type,
      }
    }

    // Solo procesar si está en paid_pending_verification
    if (intent.status !== "paid_pending_verification") {
      console.log("[v0] ⚠️ Intent status invalid:", intent.status)
      return {
        success: false,
        error: `Cannot activate intent with status: ${intent.status}`,
      }
    }

    console.log("[v0] 📋 Intent ready for activation:", {
      intent_id: intent.id,
      membership_type: intent.membership_type,
      status: intent.status,
      has_profile_data: !!(profile_data || intent.profile_data),
    })

    // Use profile_data from request OR from intent (already saved)
    const formData = profile_data || intent.profile_data

    // ========================================
    // PASO 2: MARCAR INTENT COMO ACTIVE (ATÓMICO)
    // ========================================
    const { error: updateError } = await supabase
      .from("membership_intents")
      .update({
        status: "active",
        stripe_verification_session_id: verification_session_id || null,
        verified_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent_id)

    if (updateError) {
      console.error("[v0] ❌ Failed to update intent:", updateError)
      return { success: false, error: "Failed to activate intent" }
    }

    console.log("[v0] ✅ Intent marked as ACTIVE")

    // ========================================
    // PASO 3: PERSISTIR DATOS DEL FORMULARIO (CRÍTICO)
    // ========================================
    if (formData) {
      console.log("[v0] 💾 Persisting profile form data...")

      const profileUpdate: any = {
        updated_at: new Date().toISOString(),
      }

      if (formData.full_name) {
        profileUpdate.full_name = formData.full_name
        const nameParts = formData.full_name.trim().split(" ")
        profileUpdate.first_name = nameParts[0] || ""
        profileUpdate.last_name = nameParts.slice(1).join(" ") || ""
      }
      if (formData.phone) profileUpdate.phone = formData.phone
      if (formData.document_type) profileUpdate.document_type = formData.document_type
      if (formData.document_number) profileUpdate.document_number = formData.document_number
      if (formData.address) profileUpdate.shipping_address = formData.address
      if (formData.city) profileUpdate.shipping_city = formData.city
      if (formData.postal_code) profileUpdate.shipping_postal_code = formData.postal_code
      if (formData.country) profileUpdate.shipping_country = formData.country

      const { error: profileDataError } = await supabase.from("profiles").update(profileUpdate).eq("id", user_id)

      if (profileDataError) {
        console.error("[v0] ❌ CRITICAL: Failed to persist profile data:", profileDataError)
        // ROLLBACK: Si falla la persistencia, revertir el intent a paid_pending_verification
        await supabase
          .from("membership_intents")
          .update({
            status: "paid_pending_verification",
            updated_at: new Date().toISOString(),
          })
          .eq("id", intent_id)

        return { success: false, error: "Failed to persist profile data" }
      }

      console.log("[v0] ✅ Profile data persisted successfully")
    } else {
      console.log("[v0] ⚠️ No profile_data provided, skipping persistence")
    }

    // ========================================
    // PASO 4: CREAR/ACTUALIZAR USER_MEMBERSHIPS
    // ========================================
    const { error: membershipError } = await supabase.from("user_memberships").upsert(
      {
        user_id: user_id,
        membership_type: intent.membership_type,
        billing_cycle: intent.billing_cycle,
        status: "active",
        start_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )

    if (membershipError) {
      console.error("[v0] ❌ Failed to create user_membership:", membershipError)
      return { success: false, error: "Failed to create membership record" }
    }

    console.log("[v0] ✅ user_membership created/updated")

    // ========================================
    // PASO 5: MARCAR IDENTITY_VERIFIED EN PROFILES
    // ========================================
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        identity_verified: true,
        identity_verified_at: new Date().toISOString(),
        membership_status: "active",
        membership_type: intent.membership_type,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id)

    if (profileError) {
      console.error("[v0] ❌ Failed to update profile:", profileError)
      return { success: false, error: "Failed to update profile" }
    }

    console.log("[v0] ✅ Profile marked as identity_verified")

    // ========================================
    // PASO 6: ENVIAR EMAILS (USUARIO Y ADMIN)
    // ========================================
    console.log("[v0] 📧 Sending activation emails...")

    try {
      // Get user data for emails
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, phone")
        .eq("id", user_id)
        .single()

      if (profile?.email && !profile.email.includes("@phone.semzoprive.com")) {
        // Send user email
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: profile.email,
            subject: "¡Bienvenida a Semzo Privé!",
            template: "membership_activated",
            data: {
              name: profile.full_name || "Cliente",
              membership_type: intent.membership_type,
            },
          }),
        })

        console.log("[v0] ✅ User email sent")
      }

      // Send admin notification
      const adminEmail = process.env.admin || "admin@semzoprive.com"
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: adminEmail,
          subject: "Nueva membresía activada",
          template: "admin_new_member",
          data: {
            user_id: user_id,
            name: profile?.full_name || "Sin nombre",
            email: profile?.email || "Sin email",
            phone: profile?.phone || "Sin teléfono",
            membership_type: intent.membership_type,
          },
        }),
      })

      console.log("[v0] ✅ Admin email sent")
    } catch (emailError: any) {
      console.error("[v0] ⚠️ Email sending failed (non-critical):", emailError.message)
      // No fallar la activación por emails
    }

    // ========================================
    // PASO 7: NOTIFICACIÓN ADMIN EN DASHBOARD
    // ========================================
    await supabase.from("admin_notifications").insert({
      type: "membership_activated",
      title: "Nueva membresía activa",
      message: `Usuario ${user_id} completó verificación. Membresía ${intent.membership_type} ACTIVA.`,
      severity: "success",
      user_id: user_id,
    })

    console.log("[v0] ✅✅✅ ACTIVATION COMPLETED SUCCESSFULLY ✅✅✅")

    return {
      success: true,
      membership_type: intent.membership_type,
    }
  } catch (error: any) {
    console.error("[v0] ❌ CRITICAL ERROR in orchestrator:", error)
    return { success: false, error: error.message }
  }
}
