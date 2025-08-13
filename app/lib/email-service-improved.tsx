// SERVICIO DE EMAIL DESHABILITADO PARA EVITAR DUPLICADOS
// Supabase se encarga automáticamente del envío de emails de confirmación

export class EmailServiceImproved {
  private static instance: EmailServiceImproved

  public static getInstance(): EmailServiceImproved {
    if (!EmailServiceImproved.instance) {
      EmailServiceImproved.instance = new EmailServiceImproved()
    }
    return EmailServiceImproved.instance
  }

  async sendWelcomeMembership(data: {
    to: string
    customerName: string
    membershipType: string
  }): Promise<{ success: boolean; message: string }> {
    console.log("⚠️ EmailService deshabilitado - Supabase maneja los emails automáticamente")

    // NO enviar emails manuales para evitar duplicados
    return {
      success: true,
      message: "Email service deshabilitado - Supabase se encarga automáticamente",
    }
  }

  async sendConfirmationEmail(data: {
    to: string
    customerName: string
  }): Promise<{ success: boolean; message: string }> {
    console.log("⚠️ EmailService deshabilitado - Supabase maneja los emails automáticamente")

    return {
      success: true,
      message: "Email service deshabilitado - Supabase se encarga automáticamente",
    }
  }

  async sendPasswordReset(data: {
    to: string
    resetLink: string
  }): Promise<{ success: boolean; message: string }> {
    console.log("⚠️ EmailService deshabilitado - Supabase maneja los emails automáticamente")

    return {
      success: true,
      message: "Email service deshabilitado - Supabase se encarga automáticamente",
    }
  }
}

export const productionEmailService = EmailServiceImproved
