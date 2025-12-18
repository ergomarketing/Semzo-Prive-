import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mailbox@semzoprive.com"

async function notifyAdmin(subject: string, htmlContent: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: ADMIN_EMAIL,
        subject: `[Admin] ${subject}`,
        body: htmlContent,
        html: htmlContent,
      }),
    })
  } catch (error) {
    console.error("Error notifying admin:", error)
  }
}

async function notifyUser(email: string, name: string, membershipType: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `¡Bienvenida a Semzo Privé ${membershipType}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a4b; font-family: Georgia, serif;">Semzo Privé</h1>
            </div>
            <h2 style="color: #1a1a4b;">¡Felicidades ${name || ""}!</h2>
            <p>Tu membresía <strong>${membershipType}</strong> ha sido activada exitosamente.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Plan:</strong> ${membershipType}</p>
              <p><strong>Estado:</strong> Activa</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-ES")}</p>
            </div>
            <p>Ya puedes explorar nuestra colección exclusiva de bolsos de lujo.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"}/catalog" style="background: #1a1a4b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">Explorar Catálogo</a>
            </div>
          </div>
        `,
      }),
    })
  } catch (error) {
    console.error("Error notifying user:", error)
  }
}

async function logAudit(
  supabase: any,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  oldData: any,
  newData: any,
) {
  try {
    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData || {},
      new_data: newData || {},
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Audit log error (non-critical):", error)
  }
}

function getMembershipLevel(type: string): number {
  const levels: Record<string, number> = {
    free: 0,
    petite: 1,
    essentiel: 2,
    signature: 3,
    prive: 4,
  }
  return levels[type] || 0
}

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipType, paymentId, giftCardCode, billingCycle } = await request.json()

    console.log("[v0] update-membership received:", { userId, membershipType, paymentId, giftCardCode, billingCycle })

    if (!userId || !membershipType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let cleanMembershipType = membershipType.toLowerCase().replace(/^l'/, "").trim()

    if (cleanMembershipType.includes("essentiel")) {
      cleanMembershipType = "essentiel"
    } else if (cleanMembershipType.includes("signature")) {
      cleanMembershipType = "signature"
    } else if (cleanMembershipType.includes("prive") || cleanMembershipType.includes("privé")) {
      cleanMembershipType = "prive"
    } else if (cleanMembershipType.includes("petite")) {
      cleanMembershipType = "petite"
    }

    const isWeeklyPass =
      billingCycle === "weekly" ||
      billingCycle === "semanal" ||
      billingCycle === "Semanal" ||
      billingCycle?.toLowerCase()?.includes("week") ||
      billingCycle?.toLowerCase()?.includes("semanal")

    console.log(
      "[v0] isWeeklyPass:",
      isWeeklyPass,
      "cleanMembershipType:",
      cleanMembershipType,
      "billingCycle:",
      billingCycle,
    )

    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials")
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("full_name, email, membership_status, membership_type, subscription_end_date")
      .eq("id", userId)
      .single()

    console.log("[v0] existingProfile:", existingProfile)

    if (isWeeklyPass) {
      console.log("[v0] Es pase semanal - permitiendo renovación/compra sin bloquear")
      // No bloquear - continuar con la lógica de renovación/activación
    } else if (
      existingProfile?.membership_status === "active" &&
      existingProfile?.membership_type &&
      existingProfile?.membership_type !== "free"
    ) {
      const endDate = existingProfile.subscription_end_date
        ? new Date(existingProfile.subscription_end_date)
        : new Date()

      const isUpgrade = getMembershipLevel(cleanMembershipType) > getMembershipLevel(existingProfile.membership_type)

      console.log("[v0] isUpgrade:", isUpgrade, "endDate:", endDate, "now:", new Date())

      // Solo bloquear si NO es upgrade y la membresía no ha expirado
      if (endDate > new Date() && !isUpgrade) {
        await logAudit(
          supabase,
          userId,
          "membership_purchase_blocked",
          "membership",
          userId,
          { existing_membership: existingProfile.membership_type },
          { attempted_membership: cleanMembershipType },
        )

        await supabase.from("admin_notifications").insert({
          type: "membership_duplicate_attempt",
          priority: "high",
          title: "Intento de Compra Duplicada",
          message: `Usuario ${existingProfile.email} intentó comprar membresía ${cleanMembershipType} teniendo activa ${existingProfile.membership_type}`,
          metadata: {
            user_id: userId,
            existing_membership: existingProfile.membership_type,
            attempted_membership: cleanMembershipType,
            end_date: existingProfile.subscription_end_date,
          },
        })

        return NextResponse.json(
          {
            error: "Ya tienes una membresía activa",
            existingMembership: existingProfile.membership_type,
            endDate: existingProfile.subscription_end_date,
          },
          { status: 400 },
        )
      }
    }

    let subscriptionEndDate: Date

    if (isWeeklyPass && existingProfile?.subscription_end_date) {
      // Renovación: extender desde la fecha actual de fin o desde ahora si ya expiró
      const currentEndDate = new Date(existingProfile.subscription_end_date)
      const now = new Date()

      const baseDate = currentEndDate > now ? currentEndDate : now
      subscriptionEndDate = new Date(baseDate)
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 7)

      // Máximo 3 meses desde ahora
      const maxEndDate = new Date()
      maxEndDate.setMonth(maxEndDate.getMonth() + 3)

      if (subscriptionEndDate > maxEndDate) {
        return NextResponse.json(
          {
            error: "Has alcanzado el máximo de renovaciones (3 meses). Considera una membresía mensual.",
            maxReached: true,
          },
          { status: 400 },
        )
      }
      console.log("[v0] Renovación semanal - nueva fecha fin:", subscriptionEndDate)
    } else if (isWeeklyPass) {
      // Nueva membresía semanal
      subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 7)
      console.log("[v0] Nueva semanal - fecha fin:", subscriptionEndDate)
    } else {
      // Otras membresías: 30 días
      subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30)
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        membership_status: "active",
        membership_type: cleanMembershipType,
        subscription_end_date: subscriptionEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return NextResponse.json({ error: "Failed to update membership" }, { status: 500 })
    }

    const membershipPrices: Record<string, number> = {
      petite: 19.99,
      essentiel: 59,
      signature: 129,
      prive: 189,
    }

    const { error: userMembershipError } = await supabase.from("user_memberships").upsert(
      {
        user_id: userId,
        membership_type: cleanMembershipType,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: subscriptionEndDate.toISOString(),
        can_make_reservations: true,
        stripe_subscription_id: paymentId?.startsWith("gift_") ? null : paymentId,
        payment_method_verified: true,
        failed_payment_count: 0,
      },
      { onConflict: "user_id" },
    )

    if (userMembershipError) {
      console.error("Error creating user_membership:", userMembershipError)
      return NextResponse.json({ error: "Failed to create membership record" }, { status: 500 })
    }

    await logAudit(supabase, userId, "membership_activated", "membership", userId, existingProfile, {
      membership_type: cleanMembershipType,
      status: "active",
      end_date: subscriptionEndDate.toISOString(),
    })

    if (existingProfile?.email) {
      await notifyUser(existingProfile.email, existingProfile.full_name || "", cleanMembershipType.toUpperCase())
    }

    await supabase.from("admin_notifications").insert({
      type: "new_membership",
      priority: "normal",
      title: `Nueva Membresía - ${cleanMembershipType.toUpperCase()}`,
      message: `${existingProfile?.full_name || "Usuario"} activó membresía ${cleanMembershipType}`,
      metadata: {
        user_id: userId,
        email: existingProfile?.email,
        membership_type: cleanMembershipType,
        amount: membershipPrices[cleanMembershipType],
        payment_method: giftCardCode ? "gift_card" : "stripe",
      },
    })

    await notifyAdmin(
      `Nueva Membresía - ${cleanMembershipType.toUpperCase()}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">🎉 Nueva Membresía Activada</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Cliente:</strong> ${existingProfile?.full_name || "N/A"}</p>
          <p><strong>Email:</strong> ${existingProfile?.email || "N/A"}</p>
          <p><strong>Plan:</strong> ${cleanMembershipType.toUpperCase()}</p>
          <p><strong>Precio:</strong> ${membershipPrices[cleanMembershipType] || 0}€</p>
          <p><strong>Método:</strong> ${giftCardCode ? `Gift Card (${giftCardCode})` : "Stripe"}</p>
          <p><strong>Válido hasta:</strong> ${subscriptionEndDate.toLocaleDateString("es-ES")}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/subscriptions" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver en Panel Admin</a>
      </div>
      `,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update-membership API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
