import { Resend } from "resend"
import { render } from "@react-email/components"
import { logEmail } from "@/lib/email-logger"
import { getResendApiKey } from "@/lib/resend-api-key"
import AdminNotificationEmail from "@/emails/templates/admin-notification"

const ADMIN_EMAIL = "mailbox@semzoprive.com"

type Row = { label: string; value: string }

class AdminNotifications {
  private resend: Resend

  constructor() {
    this.resend = new Resend(getResendApiKey())
  }

  private async sendAdminEmail(
    title: string,
    rows: Row[],
    emailType: string,
    metadata?: Record<string, any>,
    intro?: string,
  ): Promise<boolean> {
    try {
      console.log("[v0] Enviando notificación administrativa:", title)
      const html = await render(<AdminNotificationEmail title={title} intro={intro} rows={rows} />)
      const { data, error } = await this.resend.emails.send({
        from: "Semzo Privé <hola@semzoprive.com>",
        to: ADMIN_EMAIL,
        subject: `[Semzo Admin] ${title}`,
        html,
      })

      await logEmail({
        recipientEmail: ADMIN_EMAIL,
        recipientName: "Admin",
        subject: `[Semzo Admin] ${title}`,
        emailType,
        status: error ? "failed" : "sent",
        errorMessage: error ? String((error as any).message || error) : null,
        resendId: data?.id ?? null,
        metadata: metadata ?? null,
      })

      if (error) {
        console.error("[v0] Error Resend:", error)
        return false
      }

      console.log("[v0] Notificación administrativa enviada:", title)
      return true
    } catch (error) {
      console.error("[v0] Error enviando notificación administrativa:", error)
      return false
    }
  }

  async notifyNewContact(data: {
    name: string
    email: string
    subject: string
    message: string
    priority: string
    ticketId: string
  }) {
    return this.sendAdminEmail(
      `Nueva Consulta: ${data.subject}`,
      [
        { label: "Ticket ID", value: data.ticketId },
        { label: "Prioridad", value: data.priority },
        { label: "Nombre", value: data.name },
        { label: "Email", value: data.email },
        { label: "Asunto", value: data.subject },
        { label: "Mensaje", value: data.message },
      ],
      "contact_form",
      { ticketId: data.ticketId, priority: data.priority, customerEmail: data.email },
      "Responde a esta consulta antes de 24 horas.",
    )
  }

  async notifyNewNewsletterSubscription(data: { email: string; name?: string; preferences?: any }) {
    const rows: Row[] = [{ label: "Email", value: data.email }]
    if (data.name) rows.push({ label: "Nombre", value: data.name })
    rows.push({ label: "Fecha", value: new Date().toLocaleString("es-ES") })
    if (data.preferences) {
      rows.push({
        label: "Preferencias",
        value: Object.keys(data.preferences).filter((k) => data.preferences[k]).join(", "),
      })
    }
    return this.sendAdminEmail(
      `Nueva Suscripción Newsletter: ${data.name || data.email}`,
      rows,
      "newsletter_subscription",
      { subscriberEmail: data.email, preferences: data.preferences },
    )
  }

  async notifyNewBagAdded(data: { bagName: string; brand: string; membershipType: string; addedBy: string }) {
    return this.sendAdminEmail(
      `Nuevo Bolso Agregado: ${data.brand} ${data.bagName}`,
      [
        { label: "Marca", value: data.brand },
        { label: "Nombre", value: data.bagName },
        { label: "Colección", value: data.membershipType },
        { label: "Agregado por", value: data.addedBy },
        { label: "Fecha", value: new Date().toLocaleString("es-ES") },
      ],
      "bag_added",
      { bagName: data.bagName, brand: data.brand, membershipType: data.membershipType, addedBy: data.addedBy },
    )
  }

  async notifyBagUpdated(data: { bagName: string; brand: string; changes: string[]; updatedBy: string }) {
    return this.sendAdminEmail(
      `Bolso Actualizado: ${data.brand} ${data.bagName}`,
      [
        { label: "Bolso", value: `${data.brand} ${data.bagName}` },
        { label: "Cambios", value: data.changes.join(", ") },
        { label: "Actualizado por", value: data.updatedBy },
        { label: "Fecha", value: new Date().toLocaleString("es-ES") },
      ],
      "bag_updated",
      { bagName: data.bagName, brand: data.brand, changes: data.changes, updatedBy: data.updatedBy },
    )
  }

  async notifyBagDeleted(data: { bagName: string; brand: string; deletedBy: string }) {
    return this.sendAdminEmail(
      `Bolso Eliminado: ${data.brand} ${data.bagName}`,
      [
        { label: "Bolso", value: `${data.brand} ${data.bagName}` },
        { label: "Eliminado por", value: data.deletedBy },
        { label: "Fecha", value: new Date().toLocaleString("es-ES") },
      ],
      "bag_deleted",
      { bagName: data.bagName, brand: data.brand, deletedBy: data.deletedBy },
    )
  }

  async notifyNewUserRegistration(data: { userName: string; userEmail: string; membershipPlan?: string }) {
    const rows: Row[] = [
      { label: "Nombre", value: data.userName },
      { label: "Email", value: data.userEmail },
    ]
    if (data.membershipPlan) rows.push({ label: "Plan Seleccionado", value: data.membershipPlan })
    rows.push({ label: "Fecha", value: new Date().toLocaleString("es-ES") })
    return this.sendAdminEmail(
      `Nuevo Usuario Registrado: ${data.userName}`,
      rows,
      "user_registration",
      { userEmail: data.userEmail, membershipPlan: data.membershipPlan },
    )
  }

  async notifyReservationCancelled(data: {
    reservationId: string
    userName: string
    userEmail: string
    bagName: string
    bagBrand: string
    startDate: string
    endDate: string
    cancelledBy: "user" | "admin"
  }) {
    return this.sendAdminEmail(
      `Reserva Cancelada - ${data.bagBrand} ${data.bagName}`,
      [
        { label: "Nombre", value: data.userName },
        { label: "Email", value: data.userEmail },
        { label: "ID Reserva", value: data.reservationId },
        { label: "Bolso", value: `${data.bagBrand} - ${data.bagName}` },
        { label: "Fechas", value: `${new Date(data.startDate).toLocaleDateString("es-ES")} - ${new Date(data.endDate).toLocaleDateString("es-ES")}` },
        { label: "Cancelado por", value: data.cancelledBy === "user" ? "Cliente" : "Administrador" },
      ],
      "reservation_cancelled",
      { reservationId: data.reservationId, userEmail: data.userEmail, cancelledBy: data.cancelledBy },
    )
  }

  async notifyReservationStatusChange(data: {
    reservationId: string
    userName: string
    userEmail: string
    bagName: string
    bagBrand: string
    oldStatus: string
    newStatus: string
    startDate: string
    endDate: string
  }) {
    const statusLabels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      active: "Activa",
      completed: "Completada",
      cancelled: "Cancelada",
    }

    return this.sendAdminEmail(
      `Cambio de Estado: ${data.bagBrand} ${data.bagName}`,
      [
        { label: "Nombre", value: data.userName },
        { label: "Email", value: data.userEmail },
        { label: "ID Reserva", value: data.reservationId },
        { label: "Bolso", value: `${data.bagBrand} - ${data.bagName}` },
        { label: "Fechas", value: `${new Date(data.startDate).toLocaleDateString("es-ES")} - ${new Date(data.endDate).toLocaleDateString("es-ES")}` },
        { label: "Estado anterior", value: statusLabels[data.oldStatus] || data.oldStatus },
        { label: "Estado nuevo", value: statusLabels[data.newStatus] || data.newStatus },
      ],
      "reservation_status_change",
      {
        reservationId: data.reservationId,
        userEmail: data.userEmail,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
      },
    )
  }

  async notifyMembershipRenewed(data: {
    userName: string
    userEmail: string
    membershipType: string
    amount: number
    invoiceNumber?: string
  }) {
    const rows: Row[] = [
      { label: "Socia", value: data.userName },
      { label: "Email", value: data.userEmail },
      { label: "Membresía", value: data.membershipType },
      { label: "Importe", value: `€${data.amount.toFixed(2)}` },
    ]
    if (data.invoiceNumber) rows.push({ label: "Factura", value: data.invoiceNumber })
    return this.sendAdminEmail(
      `Renovación de Membresía: ${data.userName}`,
      rows,
      "membership_renewed",
      { userEmail: data.userEmail, membershipType: data.membershipType, amount: data.amount },
    )
  }

  async notifyPaymentFailed(data: {
    userName: string
    userEmail: string
    membershipType: string
    amount: number
    attemptCount?: number
  }) {
    const rows: Row[] = [
      { label: "Socia", value: data.userName },
      { label: "Email", value: data.userEmail },
      { label: "Membresía", value: data.membershipType },
      { label: "Importe", value: `€${data.amount.toFixed(2)}` },
    ]
    if (data.attemptCount) rows.push({ label: "Intento nº", value: String(data.attemptCount) })
    return this.sendAdminEmail(
      `Pago Fallido: ${data.userName}`,
      rows,
      "payment_failed",
      { userEmail: data.userEmail, membershipType: data.membershipType, amount: data.amount },
      "Stripe reintentará el cobro automáticamente. Revisa si requiere acción manual.",
    )
  }

  async notifyIdentityVerified(data: { userName: string; userEmail: string }) {
    return this.sendAdminEmail(
      `Identidad Verificada: ${data.userName}`,
      [
        { label: "Socia", value: data.userName },
        { label: "Email", value: data.userEmail },
      ],
      "identity_verified",
      { userEmail: data.userEmail },
      "La socia ya tiene acceso desbloqueado.",
    )
  }

  async notifyReturnStatus(data: {
    userName: string
    userEmail: string
    bagName: string
    bagBrand: string
    status: "initiated" | "received" | "completed"
    reservationId?: string
  }) {
    const statusLabels: Record<string, string> = {
      initiated: "Devolución Iniciada",
      received: "Devolución Recibida",
      completed: "Devolución Completada",
    }
    const rows: Row[] = [
      { label: "Socia", value: data.userName },
      { label: "Email", value: data.userEmail },
      { label: "Bolso", value: `${data.bagBrand} - ${data.bagName}` },
    ]
    if (data.reservationId) rows.push({ label: "ID Reserva", value: data.reservationId })
    return this.sendAdminEmail(
      `${statusLabels[data.status]}: ${data.bagBrand} ${data.bagName}`,
      rows,
      "return_status",
      { userEmail: data.userEmail, status: data.status, reservationId: data.reservationId },
    )
  }

  async notifySepaMandateRevoked(data: {
    userName: string
    userEmail: string
    paymentMethodId: string
  }) {
    return this.sendAdminEmail(
      `URGENTE: Mandato SEPA revocado — ${data.userName}`,
      [
        { label: "Socia", value: data.userName },
        { label: "Email", value: data.userEmail },
        { label: "Payment Method ID", value: data.paymentMethodId },
        { label: "Detectado", value: new Date().toLocaleString("es-ES") },
      ],
      "sepa_mandate_revoked",
      { userEmail: data.userEmail, paymentMethodId: data.paymentMethodId },
      "La socia revocó el mandato SEPA con su banco (o Stripe lo desvinculó). Nuestro seguro de cobro por no devolución ya no es válido para esta cuenta. Contactar de inmediato para regularizar o pedir un nuevo mandato antes de aceptar más reservas.",
    )
  }

  async notifySepaChargeFailed(data: {
    userName: string
    userEmail: string
    bagName: string
    bagBrand: string
    reservationId: string
    amount: number
    reason: "sin_mandato_sepa" | "error_stripe"
    errorDetail: string
  }) {
    const reasonLabels: Record<string, string> = {
      sin_mandato_sepa: "Sin mandato SEPA guardado",
      error_stripe: "Stripe rechazó el cargo (posible mandato revocado o tarjeta eliminada)",
    }
    return this.sendAdminEmail(
      `URGENTE: Cargo SEPA fallido — ${data.userName}`,
      [
        { label: "Socia", value: data.userName },
        { label: "Email", value: data.userEmail },
        { label: "Bolso", value: `${data.bagBrand} - ${data.bagName}` },
        { label: "ID Reserva", value: data.reservationId },
        { label: "Importe pendiente", value: `€${data.amount.toFixed(2)}` },
        { label: "Motivo", value: reasonLabels[data.reason] || data.reason },
        { label: "Detalle técnico", value: data.errorDetail },
      ],
      "sepa_charge_failed",
      { reservationId: data.reservationId, userEmail: data.userEmail, reason: data.reason },
      "Nuestro seguro de cobro por no devolución no pudo ejecutarse. Requiere gestión manual inmediata (contactar a la socia, reclamación, o vía legal).",
    )
  }

  async notifyDuplicateIdentity(data: {
    userName: string
    userEmail: string
    userId: string
    matchedUserName: string
    matchedUserEmail: string
    matchedUserId: string
  }) {
    return this.sendAdminEmail(
      `URGENTE: Documento de identidad duplicado — ${data.userName}`,
      [
        { label: "Cuenta nueva", value: `${data.userName} (${data.userEmail})` },
        { label: "ID cuenta nueva", value: data.userId },
        { label: "Cuenta ya existente con el mismo documento", value: `${data.matchedUserName} (${data.matchedUserEmail})` },
        { label: "ID cuenta existente", value: data.matchedUserId },
      ],
      "duplicate_identity",
      { userId: data.userId, matchedUserId: data.matchedUserId },
      "El mismo documento de identidad fue verificado en dos cuentas distintas. Puede ser una socia con una reserva vencida abriendo una cuenta nueva para seguir reservando. Revisar antes de aprobar reservas en la cuenta nueva.",
    )
  }

  async notifySepaSetupBlocked(data: {
    userName: string
    userEmail: string
    userId: string
    failedAttempts: number
  }) {
    return this.sendAdminEmail(
      `Configuración de mandato SEPA bloqueada — ${data.userName}`,
      [
        { label: "Socia", value: data.userName },
        { label: "Email", value: data.userEmail },
        { label: "ID usuario", value: data.userId },
        { label: "Intentos fallidos", value: String(data.failedAttempts) },
      ],
      "sepa_setup_blocked",
      { userId: data.userId, failedAttempts: data.failedAttempts },
      "Se bloqueó la configuración del mandato SEPA tras varios intentos fallidos (posible IBAN inválido a propósito o intento de fraude). Requiere revisión manual antes de desbloquear.",
    )
  }

  async notifyStaleRetailPrice(data: {
    bagName: string
    bagBrand: string
    bagId: string
    lastUpdatedDaysAgo: number
    chargedAmount: number
    reservationId: string
  }) {
    return this.sendAdminEmail(
      `Aviso: cargo SEPA con precio de reventa desactualizado — ${data.bagBrand} ${data.bagName}`,
      [
        { label: "Bolso", value: `${data.bagBrand} - ${data.bagName}` },
        { label: "ID bolso", value: data.bagId },
        { label: "Precio sin actualizar hace", value: `${data.lastUpdatedDaysAgo} días` },
        { label: "Importe cobrado con este precio", value: `€${data.chargedAmount.toFixed(2)}` },
        { label: "ID Reserva", value: data.reservationId },
      ],
      "stale_retail_price",
      { bagId: data.bagId, lastUpdatedDaysAgo: data.lastUpdatedDaysAgo, reservationId: data.reservationId },
      "El precio de reventa de este bolso no se actualiza hace tiempo. Si el valor de mercado subió, el seguro SEPA pudo haber cobrado de menos. Revisar y actualizar retail_price.",
    )
  }

  async notifyShipmentStatus(data: {
    userName: string
    userEmail: string
    bagName: string
    bagBrand: string
    status: "created" | "in_transit" | "delivered"
    trackingNumber?: string
  }) {
    const statusLabels: Record<string, string> = {
      created: "Envío Creado",
      in_transit: "Envío en Tránsito",
      delivered: "Envío Entregado",
    }
    const rows: Row[] = [
      { label: "Socia", value: data.userName },
      { label: "Email", value: data.userEmail },
      { label: "Bolso", value: `${data.bagBrand} - ${data.bagName}` },
    ]
    if (data.trackingNumber) rows.push({ label: "Tracking", value: data.trackingNumber })
    return this.sendAdminEmail(
      `${statusLabels[data.status]}: ${data.bagBrand} ${data.bagName}`,
      rows,
      "shipment_status",
      { userEmail: data.userEmail, status: data.status, trackingNumber: data.trackingNumber },
    )
  }
}

export const adminNotifications = new AdminNotifications()
