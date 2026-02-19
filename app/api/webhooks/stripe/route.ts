}
break
case "invoice.payment_succeeded":
case "invoice.paid": {
  const invoice = event.data.object as Stripe.Invoice

  console.log("💰 [INVOICE] Invoice paid:", {
    invoiceId: invoice.id,
    subscriptionId: invoice.subscription,
    billingReason: invoice.billing_reason,
    amount: invoice.amount_paid / 100,
  })

  // 1️⃣ Skip primera factura (activación ya hecha en checkout.session.completed)
  if (invoice.billing_reason === "subscription_create") {
    console.log("⏩ [INVOICE] First invoice detected — skipping")
    break
  }

  // 2️⃣ Debe existir subscription_id
  if (!invoice.subscription || typeof invoice.subscription !== "string") {
    console.log("⏩ [INVOICE] No valid subscription_id — skipping")
    break
  }

  try {
    // 3️⃣ Recuperar suscripción desde Stripe (fuente única de verdad)
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)

    console.log("🔄 [INVOICE] Renewal detected:", {
      subscriptionId: subscription.id,
      status: subscription.status,
      periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    })

    const userId = subscription.metadata?.user_id || null

    if (!userId) {
      console.error("❌ [INVOICE] Missing user_id in subscription metadata")
      break
    }

    // 4️⃣ Verificar que exista membresía
    const { data: existingMembership, error: lookupError } = await supabaseAdmin
      .from("user_memberships")
      .select("id, user_id, membership_type")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle()

    if (lookupError || !existingMembership) {
      console.error("❌ [INVOICE] Membership not found for subscription:", subscription.id)
      break
    }

    const now = new Date().toISOString()

    // 5️⃣ Actualizar fechas (solo renovación — NO UPSERT)
    const { data: updatedMembership, error: membershipError } = await supabaseAdmin
      .from("user_memberships")
      .update({
        status: subscription.status,
        starts_at: new Date(subscription.current_period_start * 1000).toISOString(),
        ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: now,
      })
      .eq("stripe_subscription_id", subscription.id)
      .select()
      .single()

    if (membershipError) {
      console.error("❌ [INVOICE] Error updating membership:", membershipError)
      break
    }

    console.log("✅ [INVOICE] Membership renewed:", {
      userId: updatedMembership.user_id,
      newEndDate: updatedMembership.ends_at,
    })

    // 6️⃣ Sincronizar profile
    await supabaseAdmin
      .from("profiles")
      .update({
        membership_status: subscription.status,
        updated_at: now,
      })
      .eq("id", updatedMembership.user_id)

    // 7️⃣ Registrar pago (idempotente por stripe_invoice_id)
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
          paid_at: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : now,
          created_at: new Date(invoice.created * 1000).toISOString(),
        },
        { onConflict: "stripe_invoice_id" },
      )

    console.log("✅ [INVOICE] Payment recorded")

    // 8️⃣ Obtener perfil para emails
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", updatedMembership.user_id)
      .maybeSingle()

    // 9️⃣ Email usuario
    if (profile?.email) {
      const membershipNames: Record<string, string> = {
        petite: "Petite",
        essentiel: "L'Essentiel",
        signature: "Signature",
        prive: "Privé",
      }

      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: profile.email,
          subject: "Tu membresía Semzo Privé ha sido renovada",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2>Membresía Renovada</h2>
              <p>Hola ${profile.full_name || ""},</p>
              <p>Tu membresía <strong>${
                membershipNames[updatedMembership.membership_type] ||
                updatedMembership.membership_type
              }</strong> ha sido renovada correctamente.</p>
              <p><strong>Monto:</strong> €${(invoice.amount_paid / 100).toFixed(2)}</p>
              <p><strong>Válida hasta:</strong> ${new Date(
                subscription.current_period_end * 1000,
              ).toLocaleDateString("es-ES")}</p>
              ${invoice.invoice_pdf ? `<p><a href="${invoice.invoice_pdf}">Descargar factura</a></p>` : ""}
            </div>
          `,
        }),
      }).catch(() => {})
    }

    console.log("✅ [INVOICE] Renewal flow completed")
  } catch (error: any) {
    console.error("❌ [INVOICE] Renewal error:", error?.message)
  }

  break
}

