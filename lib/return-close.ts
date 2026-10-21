/**
 * Cierre de una reserva cuando la devolucion FISICA del bolso queda confirmada (la verifica Erika).
 *
 * Es el unico camino valido a 'completed' por devolucion: cierra la reserva, libera el bolso, avisa a quien lo
 * tenia en su wishlist, registra la auditoria, activa el "proximo bolso" en cola de la socia (si lo tiene),
 * reconcilia la comision de partners y manda a la socia el correo de "devolucion recibida".
 * Idempotente: si la reserva ya no esta en curso (active/overdue/confirmed) no hace nada.
 * Lo usan Logistica -> Devoluciones (PATCH de returns) y el boton "Recibida" de las devoluciones en camino.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import { EmailServiceProduction } from "@/app/lib/email-service-production"
import { reconcileRentalCommission } from "@/lib/partners"
import { enrollLifecycleSequence } from "@/lib/lifecycle-emails/enroll"
import { promoteQueuedReservation } from "@/lib/next-bag-queue"
import { renderAdminEmail } from "@/app/lib/email-layout"
import { klaviyoTrackForUser } from "@/lib/klaviyo"

export async function closeReservationOnReturnReceived(
  supabase: SupabaseClient,
  reservationId: string,
): Promise<{ closed: boolean; reason?: string }> {
  const { data: reservation } = await supabase
    .from("reservations")
    .select(
      "id, bag_id, status, user_id, total_amount, profiles!reservations_user_id_fkey ( email, full_name, first_name, last_name ), bags!reservations_bag_id_fkey ( name, brand )",
    )
    .eq("id", reservationId)
    .maybeSingle()
  if (!reservation) return { closed: false, reason: "reservation_not_found" }
  const profile = (reservation as any).profiles
  const bag = (reservation as any).bags
  if (!["active", "overdue", "confirmed"].includes(reservation.status)) {
    return { closed: false, reason: `reservation_${reservation.status}` }
  }

  // Cerrar la reserva ligada y liberar el bolso (solo si no es admin rent).
  // Esta es la UNICA transicion valida a 'completed': devolucion fisica confirmada.
  if (reservation?.id && ["active", "overdue", "confirmed"].includes(reservation.status)) {
    await supabase
      .from("reservations")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", reservation.id)

    // Klaviyo (solo analitica): ciclo cerrado por devolucion fisica confirmada. Nunca lanza.
    await klaviyoTrackForUser(supabase, reservation.user_id, {
      metric: "Return Received",
      uniqueId: `return-received:${reservation.id}`,
      properties: { bag_name: bag?.name ?? null, bag_brand: bag?.brand ?? null },
    })

    if (reservation.bag_id) {
      await supabase.from("bags").update({ status: "available" }).eq("id", reservation.bag_id)

      // Fase 3 — Back-in-stock: notificar a quien tenga este bolso en
      // su wishlist. Best-effort, nunca bloquea el cierre de la devolucion.
      try {
        const { data: wishlistEntries } = await supabase
          .from("wishlists")
          .select("user_id")
          .eq("bag_id", reservation.bag_id)

        for (const entry of wishlistEntries || []) {
          const { data: wishlistProfile } = await supabase
            .from("profiles")
            .select("email, full_name, first_name")
            .eq("id", entry.user_id)
            .maybeSingle()

          if (!wishlistProfile?.email) continue

          await enrollLifecycleSequence({
            sequenceKey: "back_in_stock",
            entityType: "wishlist_item",
            entityId: `${reservation.bag_id}-${entry.user_id}`,
            userId: entry.user_id,
            email: wishlistProfile.email,
            name: wishlistProfile.full_name || wishlistProfile.first_name || "",
            vars: { bag_name: bag ? `${bag.brand} ${bag.name}`.trim() : "" },
          })
        }
      } catch (wishlistErr) {
        console.error("[Logistics API] Error notificando back-in-stock:", wishlistErr)
      }
    }

    await supabase.from("logistics_audit_log").insert({
      action: "reservation_completed_on_return",
      entity_type: "reservation",
      entity_id: reservation.id,
      old_values: { status: reservation.status },
      new_values: { status: "completed", trigger: `return_${status}` },
    })

    // "Proximo bolso": si la socia tenia otro bolso reservado en cola, pasa a confirmado y entra en el
    // flujo normal de envio (o se cancela si su membresia ya no esta activa). Nunca bloquea el cierre.
    if (reservation.user_id) {
      const promotion = await promoteQueuedReservation(supabase, reservation.user_id)
      if (promotion.promoted || promotion.cancelled) {
        const who = profile?.full_name || profile?.email || reservation.user_id
        const message = promotion.promoted
          ? `${who}: recibida la devolución. Su PRÓXIMO BOLSO (${promotion.bagLabel}) ya está confirmado: prepara el envío.`
          : `${who}: recibida la devolución, pero su membresía ya no está activa: se canceló su próximo bolso en cola.`
        await supabase
          .from("admin_notifications")
          .insert({
            type: promotion.promoted ? "next_bag_ready_to_ship" : "next_bag_cancelled",
            priority: "high",
            title: promotion.promoted ? "Próximo bolso listo para enviar" : "Próximo bolso cancelado",
            message,
            metadata: { user_id: reservation.user_id, reservation_id: promotion.reservationId },
          })
          .then(({ error }) => error && console.error("[Logistics API] admin_notifications próximo bolso:", error.message))
        await EmailServiceProduction.getInstance()
          .sendWithResend({
            to: "mailbox@semzoprive.com",
            subject: promotion.promoted ? `[Admin] Preparar envío: próximo bolso de ${who}` : `[Admin] Próximo bolso cancelado: ${who}`,
            html: renderAdminEmail({
              title: promotion.promoted ? "Próximo bolso listo para enviar" : "Próximo bolso cancelado",
              intro: message,
              rows: [
                { label: "Socia", value: String(who) },
                ...(promotion.bagLabel ? [{ label: "Bolso", value: promotion.bagLabel }] : []),
              ],
              accent: promotion.promoted ? "success" : "danger",
            }),
          })
          .catch((err) => console.error("[Logistics API] Error avisando próximo bolso:", err))
      }
    }

    // Sistema de partners: devolucion OK sin incidencias -> comision
    // liquidable si el cliente aplico un codigo de partner. Idempotente.
    if (reservation.user_id) {
      await reconcileRentalCommission({
        reservationId: reservation.id,
        userId: reservation.user_id,
        baseAmount: Number(reservation.total_amount) || 0,
      }).catch((err) => console.error("[Logistics API] Error reconciliando comision partner:", err))
    }
  }

  if (profile?.email) {
    const userName =
      profile.full_name ||
      `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
      "Cliente"
    const bagName = bag ? `${bag.brand} ${bag.name}`.trim() : "tu bolso"

    const emailService = EmailServiceProduction.getInstance()
    await emailService
      .sendReturnReceivedEmail({
        userEmail: profile.email,
        userName,
        bagName,
      })
      .catch((err) => console.error("[Logistics API] Error enviando email return received:", err))
  }

  return { closed: true }
}
