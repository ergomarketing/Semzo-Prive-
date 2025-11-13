// Configuración de administración
export const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "semzo2024!",
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
}

// Configuración de email
export const EMAIL_CONFIG = {
  provider: "resend",
  fromEmail: process.env.EMAIL_FROM || "noreply@semzoprive.com",
  fromName: "Semzo Privé",
  replyTo: process.env.EMAIL_REPLY_TO || "hola@semzoprive.com",
  providers: {
    resend: {
      baseUrl: "https://api.resend.com",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EMAIL_API_KEY || ""}`,
      },
    },
  },
}
