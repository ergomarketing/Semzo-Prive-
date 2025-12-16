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
  await supabase.from("audit_log").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
    created_at: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId, membershipType, paymentId, giftCardCode } = await request.json()

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

    const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey =
      process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY

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

    if (
      existingProfile?.membership_status === "active" &&
      existingProfile?.membership_type &&
      existingProfile?.membership_type !== "free"
    ) {
      const endDate = existingProfile.subscription_end_date
        ? new Date(existingProfile.subscription_end_date)
        : new Date()

      if (endDate > new Date()) {
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

    const subscriptionEndDate = new Date()
    if (cleanMembershipType === "petite") {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 7)
    } else {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30)
    }

    if (existingProfile?.membership_type && existingProfile.membership_type !== "free") {
      await supabase
        .from("membership_history")
        .update({ ended_at: new Date().toISOString(), reason: "upgraded" })
        .eq("user_id", userId)
        .is("ended_at", null)
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        membership_status: "active", // Siempre "active"
        membership_type: cleanMembershipType, // El tipo específico
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

    await supabase.from("membership_history").insert({
      user_id: userId,
      membership_type: cleanMembershipType,
      status: "active",
      started_at: new Date().toISOString(),
      payment_method: giftCardCode ? "gift_card" : "stripe",
      payment_reference: paymentId,
      amount: membershipPrices[cleanMembershipType] || 0,
    })

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
