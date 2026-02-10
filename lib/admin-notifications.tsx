import { Resend } from "resend"

const ADMIN_EMAIL = "mailbox@semzoprive.com"

class AdminNotifications {
  private resend: Resend

  constructor() {
    this.resend = new Resend(process.env.EMAIL_API_KEY)
  }

  private async sendAdminEmail(
    subject: string,
    html: string,
    emailType: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    try {
      console.log("[v0] 📧 Enviando notificación administrativa:", subject)
      const { data, error } = await this.resend.emails.send({
        from: "Semzo Privé <notifications@semzoprive.com>",
        to: ADMIN_EMAIL,
        subject: `[Semzo Admin] ${subject}`,
        html,
      })

      if (error) {
        console.error("[v0] ❌ Error Resend:", error)
        return false
      }

      console.log("[v0] ✅ Notificación administrativa enviada:", subject)
      return true
    } catch (error) {
      console.error("[v0] ❌ Error enviando notificación administrativa:", error)
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
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a4b; margin-top: 0; border-bottom: 3px solid #E8B4CB; padding-bottom: 15px;">
            📬 Nueva Consulta de Cliente
          </h2>
          
          <div style="background: #fff5f8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E8B4CB;">
            <p style="margin: 0 0 10px 0;"><strong style="color: #1a1a4b;">Ticket ID:</strong> ${data.ticketId}</p>
            <p style="margin: 0 0 10px 0;"><strong style="color: #1a1a4b;">Prioridad:</strong> 
              <span style="background: ${data.priority === "Alta" ? "#dc2626" : data.priority === "Media" ? "#f59e0b" : "#10b981"}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;">
                ${data.priority}
              </span>
            </p>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="color: #1a1a4b; font-size: 16px; margin-bottom: 10px;">Información del Cliente</h3>
            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${data.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #1a1a4b;">${data.email}</a></p>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="color: #1a1a4b; font-size: 16px; margin-bottom: 10px;">Asunto</h3>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 0;">${data.subject}</p>
          </div>

          <div style="margin: 25px 0;">
            <h3 style="color: #1a1a4b; font-size: 16px; margin-bottom: 10px;">Mensaje</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; line-height: 1.6;">
              ${data.message.replace(/\n/g, "<br>")}
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
              Responde a esta consulta antes de 24 horas
            </p>
            <a href="mailto:${data.email}" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Responder Cliente
            </a>
          </div>
        </div>
      </div>
      `,
      "contact_form",
      { ticketId: data.ticketId, priority: data.priority, customerEmail: data.email },
    )
  }

  async notifyNewNewsletterSubscription(data: { email: string; name?: string; preferences?: any }) {
    return this.sendAdminEmail(
      `Nueva Suscripción Newsletter: ${data.name || data.email}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">📰 Nueva Suscripción al Newsletter</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${data.email}</p>
          ${data.name ? `<p><strong>Nombre:</strong> ${data.name}</p>` : ""}
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
          ${
            data.preferences
              ? `<p><strong>Preferencias:</strong> ${Object.keys(data.preferences)
                  .filter((k) => data.preferences[k])
                  .join(", ")}</p>`
              : ""
          }
        </div>
      </div>
      `,
      "newsletter_subscription",
      { subscriberEmail: data.email, preferences: data.preferences },
    )
  }

  async notifyNewBagAdded(data: { bagName: string; brand: string; membershipType: string; addedBy: string }) {
    return this.sendAdminEmail(
      `Nuevo Bolso Agregado: ${data.brand} ${data.bagName}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">👜 Nuevo Bolso en Inventario</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Marca:</strong> ${data.brand}</p>
          <p><strong>Nombre:</strong> ${data.bagName}</p>
          <p><strong>Colección:</strong> <span style="text-transform: uppercase; background: #1a1a4b; color: white; padding: 4px 12px; border-radius: 4px;">${data.membershipType}</span></p>
          <p><strong>Agregado por:</strong> ${data.addedBy}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/inventory" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Inventario</a>
      </div>
      `,
      "bag_added",
      { bagName: data.bagName, brand: data.brand, membershipType: data.membershipType, addedBy: data.addedBy },
    )
  }

  async notifyBagUpdated(data: {
    bagName: string
    brand: string
    changes: string[]
    updatedBy: string
  }) {
    return this.sendAdminEmail(
      `Bolso Actualizado: ${data.brand} ${data.bagName}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">✏️ Bolso Actualizado</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Bolso:</strong> ${data.brand} ${data.bagName}</p>
          <p><strong>Cambios realizados:</strong></p>
          <ul>
            ${data.changes.map((change) => `<li>${change}</li>`).join("")}
          </ul>
          <p><strong>Actualizado por:</strong> ${data.updatedBy}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
      </div>
      `,
      "bag_updated",
      { bagName: data.bagName, brand: data.brand, changes: data.changes, updatedBy: data.updatedBy },
    )
  }

  async notifyBagDeleted(data: { bagName: string; brand: string; deletedBy: string }) {
    return this.sendAdminEmail(
      `Bolso Eliminado: ${data.brand} ${data.bagName}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">🗑️ Bolso Eliminado del Inventario</h2>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Bolso:</strong> ${data.brand} ${data.bagName}</p>
          <p><strong>Eliminado por:</strong> ${data.deletedBy}</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
      </div>
      `,
      "bag_deleted",
      { bagName: data.bagName, brand: data.brand, deletedBy: data.deletedBy },
    )
  }

  async notifyNewUserRegistration(data: { userName: string; userEmail: string; membershipPlan?: string }) {
    return this.sendAdminEmail(
      `Nuevo Usuario Registrado: ${data.userName}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">👤 Nuevo Usuario Registrado</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nombre:</strong> ${data.userName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail}</a></p>
          ${data.membershipPlan ? `<p><strong>Plan Seleccionado:</strong> <span style="text-transform: uppercase; background: #1a1a4b; color: white; padding: 4px 12px; border-radius: 4px;">${data.membershipPlan}</span></p>` : ""}
          <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/members" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Todos los Miembros</a>
      </div>
      `,
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
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626;">❌ Reserva Cancelada</h2>
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #1a1a4b; margin-top: 0;">Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${data.userName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail}</a></p>
          
          <h3 style="color: #1a1a4b;">Detalles de la Reserva</h3>
          <p><strong>ID Reserva:</strong> ${data.reservationId}</p>
          <p><strong>Bolso:</strong> ${data.bagBrand} - ${data.bagName}</p>
          <p><strong>Fechas:</strong> ${new Date(data.startDate).toLocaleDateString("es-ES")} - ${new Date(data.endDate).toLocaleDateString("es-ES")}</p>
          <p><strong>Cancelado por:</strong> <span style="text-transform: capitalize;">${data.cancelledBy === "user" ? "Cliente" : "Administrador"}</span></p>
          <p><strong>Fecha de cancelación:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/reservations" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver Todas las Reservas</a>
        </div>
      </div>
      `,
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
    const statusColors: Record<string, string> = {
      pending: "#f59e0b",
      confirmed: "#10b981",
      active: "#3b82f6",
      completed: "#6b7280",
      cancelled: "#dc2626",
    }

    const statusLabels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      active: "Activa",
      completed: "Completada",
      cancelled: "Cancelada",
    }

    return this.sendAdminEmail(
      `Cambio de Estado: ${data.bagBrand} ${data.bagName}`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a4b;">🔄 Cambio de Estado de Reserva</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1a1a4b; margin-top: 0;">Información del Cliente</h3>
          <p><strong>Nombre:</strong> ${data.userName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.userEmail}">${data.userEmail}</a></p>
          
          <h3 style="color: #1a1a4b;">Detalles de la Reserva</h3>
          <p><strong>ID Reserva:</strong> ${data.reservationId}</p>
          <p><strong>Bolso:</strong> ${data.bagBrand} - ${data.bagName}</p>
          <p><strong>Fechas:</strong> ${new Date(data.startDate).toLocaleDateString("es-ES")} - ${new Date(data.endDate).toLocaleDateString("es-ES")}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 6px;">
            <p style="margin: 0;"><strong>Estado anterior:</strong> 
              <span style="background: ${statusColors[data.oldStatus] || "#6b7280"}; color: white; padding: 4px 12px; border-radius: 4px; text-transform: capitalize;">
                ${statusLabels[data.oldStatus] || data.oldStatus}
              </span>
            </p>
            <p style="margin: 15px 0 0 0;"><strong>Estado nuevo:</strong> 
              <span style="background: ${statusColors[data.newStatus] || "#6b7280"}; color: white; padding: 4px 12px; border-radius: 4px; text-transform: capitalize;">
                ${statusLabels[data.newStatus] || data.newStatus}
              </span>
            </p>
          </div>
          
          <p><strong>Fecha del cambio:</strong> ${new Date().toLocaleString("es-ES")}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/reservations" style="background: #1a1a4b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver en Panel Admin</a>
        </div>
      </div>
      `,
      "reservation_status_change",
      {
        reservationId: data.reservationId,
        userEmail: data.userEmail,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
      },
    )
  }
}

export const adminNotifications = new AdminNotifications()
