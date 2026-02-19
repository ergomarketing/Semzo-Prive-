case "invoice.payment_succeeded":
case "invoice.paid": {
  const invoice = event.data.object as Stripe.Invoice

  console.log("💰 [INVOICE.PAID] Invoice paid:", {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    billingReason: invoice.billing_reason,
    amount: invoice.amount_paid / 100,
  })

  if (invoice.billing_reason === "subscription_create") {
    console.log("⏩ [INVOICE.PAID] First invoice - skip (already activated)")
    break
  }

  if (!invoice.subscription || typeof invoice.subscription !== "string") {
    console.log("⏩ [INVOICE.PAID] No subscription - skip")
    break
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

    console.log("🔄 [INVOICE.PAID] Subscription renewal:", {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    })

    const userId =
      subscription.metadata?.user_id ||
      (invoice.lines.data[0]?.metadata?.user_id as string | undefined)

    if (!userId) {
      console.error("❌ [INVOICE.PAID] No user_id in metadata")
      break
    }

    // STEP 1: Validate membership exists
    const { data: existingMembership } = await supabaseAdmin
      .from("user_memberships")
      .select("id, user_id, membership_type")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle()

    if (!existingMembership) {
      console.error("❌ [INVOICE.PAID] Membership not found for subscription:", subscription.id)
      break
    }

    // STEP 2: Update membership dates
    const { data: updatedMembership, error: membershipError } = await supabaseAdmin
      .from("user_memberships")
      .update({
        status: subscription.status === "active" ? "active" : subscription.status,
        starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
        ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id)
      .select()
      .single()

    if (membershipError) {
      console.error("❌ [INVOICE.PAID] Error updating membership:", membershipError)
      break
    }

    console.log("✅ [INVOICE.PAID] Membership renewed:", {
      userId: updatedMembership.user_id,
      membershipType: updatedMembership.membership_type,
      newEndDate: updatedMembership.ends_at,
    })

    // STEP 3: Update profile
    await supabaseAdmin
      .from("profiles")
      .update({
        membership_status: subscription.status === "active" ? "active" : subscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updatedMembership.user_id)

    // STEP 4: Record payment
    await supabaseAdmin
      .from("payment_history")
      .upsert(
        {
          user_id: updatedMembership.user_id,
          stripe_invoice_id: invoice.id,
          stripe_subscription_id: subscription.id,
          amount_cents: invoice.amount_paid,
          currency: invoice.currency,
          status: "paid",
          billing_reason: invoice.billing_reason,
          period_start: new Date(invoice.period_start * 1000).toISOString(),
          period_end: new Date(invoice.period_end * 1000).toISOString(),
          invoice_pdf: invoice.invoice_pdf || null,
          paid_at: invoice.status_transitions.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : new Date().toISOString(),
          created_at: new Date(invoice.created * 1000).toISOString(),
        },
        { onConflict: "stripe_invoice_id" },
      )

    console.log("✅ [INVOICE.PAID] Payment recorded")

    // STEP 5: Get user profile for email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", updatedMembership.user_id)
      .single()

    // STEP 6: Send renewal confirmation email to user
    if (profile?.email) {
      const membershipNames = {
        petite: "Petite",
        essentiel: "L'Essentiel",
        signature: "Signature",
        prive: "Privé",
      }

      const emailBody = {
        to: profile.email,
        subject: "Tu membresía Semzo Privé ha sido renovada",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">Membresía Renovada</h2>
            <p>Hola ${profile.full_name || ""},</p>
            <p>Tu membresía <strong>${membershipNames[updatedMembership.membership_type as keyof typeof membershipNames] || updatedMembership.membership_type}</strong> ha sido renovada exitosamente.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Monto:</strong> €${(invoice.amount_paid / 100).toFixed(2)}</p>
              <p style="margin: 5px 0;"><strong>Válida hasta:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 5px 0;"><strong>Factura ID:</strong> ${invoice.number || invoice.id}</p>
            </div>
            ${invoice.invoice_pdf ? `<p><a href="${invoice.invoice_pdf}" style="color: #000; text-decoration: underline;">Descargar factura PDF</a></p>` : ''}
            <p>Gracias por seguir siendo parte de Semzo Privé.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              Si tienes alguna pregunta, responde a este email o visita tu dashboard.
            </p>
          </div>
        `,
      }

      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailBody),
        })

        if (emailResponse.ok) {
          console.log("✅ [INVOICE.PAID] Renewal email sent to:", profile.email)
        } else {
          console.error("⚠️ [INVOICE.PAID] Error sending renewal email")
        }
      } catch (emailError) {
        console.error("⚠️ [INVOICE.PAID] Error sending email:", emailError)
      }
    }

    // STEP 7: Send admin notification
    const adminEmailBody = {
      to: process.env.ADMIN_EMAIL || "admin@semzoprive.com",
      subject: `Renovación de membresía: ${profile?.full_name || updatedMembership.user_id}`,
      html: `
        <div style="font-family: sans-serif;">
          <h3>Renovación Exitosa</h3>
          <p><strong>Usuario:</strong> ${profile?.full_name || "N/A"} (${profile?.email || "Sin email"})</p>
          <p><strong>Membresía:</strong> ${updatedMembership.membership_type}</p>
          <p><strong>Monto:</strong> €${(invoice.amount_paid / 100).toFixed(2)}</p>
          <p><strong>Nueva fecha de expiración:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleDateString('es-ES')}</p>
          <p><strong>Invoice ID:</strong> ${invoice.id}</p>
          <p><strong>Subscription ID:</strong> ${subscription.id}</p>
        </div>
      `,
    }

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminEmailBody),
    }).catch(() => {})

    console.log("✅ [INVOICE.PAID] Renewal complete")

  } catch (error: any) {
    console.error("❌ [INVOICE.PAID] Error:", error.message)
  }

  break
}
