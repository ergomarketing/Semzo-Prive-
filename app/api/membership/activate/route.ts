import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase/server"

// CRITICAL: No cache - authenticated mutation endpoint
export const dynamic = "force-dynamic"

/**
 * ACTIVATION & WEBHOOK ORCHESTRATOR
 * 
 * Responsabilidad exclusiva:
 * Cuando una membresía pasa a active, TODO lo demás ocurre exactamente una vez.
 * 
 * Endpoint idempotente - puede llamarse múltiples veces sin duplicar acciones.
 */

export async function POST(request: Request) {
  console.log("[v0] 🎯 ACTIVATION ORCHESTRATOR - START")

  try {
    const body = await request.json()
    const { user_id, intent_id, verification_session_id, profile_data } = body

    if (!user_id || !intent_id) {
      console.log("[v0] ❌ Missing required fields:", { user_id, intent_id })
      return NextResponse.json({ error: "Missing user_id or intent_id" }, { status: 400 })
    }

    const supabase = await createClient()

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
      return NextResponse.json({ error: "Intent not found" }, { status: 404 })
    }

    // Si ya está activo, retornar éxito (idempotencia)
    if (intent.status === "active") {
      console.log("[v0] ✅ Intent already active - IDEMPOTENT RETURN")
      return NextResponse.json({ 
        success: true, 
        message: "Membership already active",
        already_active: true 
      })
    }

    // Solo procesar si está en paid_pending_verification
    if (intent.status !== "paid_pending_verification") {
      console.log("[v0] ⚠️ Intent status invalid:", intent.status)
      return NextResponse.json({ 
        error: `Cannot activate intent with status: ${intent.status}` 
      }, { status: 400 })
    }

    console.log("[v0] 📋 Intent ready for activation:", {
      intent_id: intent.id,
      membership_type: intent.membership_type,
      status: intent.status,
      has_profile_data: !!(profile_data || intent.profile_data)
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
        updated_at: new Date().toISOString()
      })
      .eq("id", intent_id)

    if (updateError) {
      console.log("[v0] ❌ Failed to update intent:", updateError)
      return NextResponse.json({ error: "Failed to activate intent" }, { status: 500 })
    }

    console.log("[v0] ✅ Intent marked as ACTIVE")

    // ========================================
    // PASO 3: PERSISTIR DATOS DEL FORMULARIO (CRÍTICO)
    // ========================================
    if (formData) {
      console.log("[v0] 💾 Persisting profile form data...")
      
      const profileUpdate: any = {
        updated_at: new Date().toISOString()
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

      const { error: profileDataError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user_id)

      if (profileDataError) {
        console.error("[v0] ❌ CRITICAL: Failed to persist profile data:", profileDataError)
        // ROLLBACK: Si falla la persistencia, revertir el intent a paid_pending_verification
        await supabase
          .from("membership_intents")
          .update({ 
            status: "paid_pending_verification",
            updated_at: new Date().toISOString()
          })
          .eq("id", intent_id)
        
        return NextResponse.json({ 
          error: "Failed to persist profile data" 
        }, { status: 500 })
      }

      console.log("[v0] ✅ Profile data persisted successfully")
    } else {
      console.log("[v0] ⚠️ No profile_data provided, skipping persistence")
    }

    // ========================================
    // PASO 4: CREAR/ACTUALIZAR USER_MEMBERSHIPS
    // ========================================
    const startDate = new Date()
    const endDate = new Date(startDate)
    
    // Calcular fecha de expiración según billing_cycle
    if (intent.billing_cycle === "weekly") {
      endDate.setDate(endDate.getDate() + 7)
    } else if (intent.billing_cycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (intent.billing_cycle === "quarterly") {
      endDate.setMonth(endDate.getMonth() + 3)
    } else if (intent.billing_cycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    const { error: membershipError } = await supabase
      .from("user_memberships")
      .upsert({
        user_id: user_id,
        membership_type: intent.membership_type,
        billing_cycle: intent.billing_cycle,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      })

    if (membershipError) {
      console.log("[v0] ⚠️ Warning: Failed to create user_membership:", membershipError)
      // No bloqueamos el flujo por esto
    } else {
      console.log("[v0] ✅ User membership created/updated")
    }

    // ========================================
    // PASO 4: ACTUALIZAR IDENTITY_VERIFIED EN PROFILES
    // ========================================
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        identity_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", user_id)

    if (profileError) {
      console.log("[v0] ⚠️ Warning: Failed to update profile:", profileError)
    } else {
      console.log("[v0] ✅ Profile identity_verified updated")
    }

    // ========================================
    // PASO 5: ENVIAR EMAIL AL USUARIO
    // ========================================
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user_id)
        .single()

      if (profile?.email && !profile.email.includes("@phone.semzoprive.com")) {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: profile.email,
            type: "membership_activated",
            data: {
              fullName: profile.full_name,
              membershipType: intent.membership_type,
              startDate: startDate.toISOString()
            }
          })
        })

        if (emailResponse.ok) {
          console.log("[v0] ✅ User email sent")
        } else {
          console.log("[v0] ⚠️ User email failed:", await emailResponse.text())
        }
      } else {
        console.log("[v0] ℹ️ No valid email for user, skipping user email")
      }
    } catch (emailError) {
      console.log("[v0] ⚠️ User email error:", emailError)
    }

    // ========================================
    // PASO 6: ENVIAR NOTIFICACIÓN AL ADMIN
    // ========================================
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, phone")
        .eq("id", user_id)
        .single()

      const adminEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "admin@semzoprive.com",
          type: "new_member_admin",
          data: {
            fullName: profile?.full_name || "Usuario",
            email: profile?.email || "N/A",
            phone: profile?.phone || "N/A",
            membershipType: intent.membership_type,
            startDate: startDate.toISOString()
          }
        })
      })

      if (adminEmailResponse.ok) {
        console.log("[v0] ✅ Admin email sent")
      } else {
        console.log("[v0] ⚠️ Admin email failed:", await adminEmailResponse.text())
      }
    } catch (adminEmailError) {
      console.log("[v0] ⚠️ Admin email error:", adminEmailError)
    }

    // ========================================
    // PASO 7: LOG DE AUDITORÍA
    // ========================================
    console.log("[v0] 🎉 ACTIVATION ORCHESTRATOR - SUCCESS", {
      user_id,
      intent_id,
      membership_type: intent.membership_type,
      billing_cycle: intent.billing_cycle,
      activated_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Membership activated successfully",
      data: {
        user_id,
        intent_id,
        membership_type: intent.membership_type,
        status: "active"
      }
    })

  } catch (error) {
    console.error("[v0] ❌ ACTIVATION ORCHESTRATOR - ERROR:", error)
    return NextResponse.json(
      { error: "Internal server error during activation" },
      { status: 500 }
    )
  }
}
