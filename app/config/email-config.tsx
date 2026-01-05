// 🔧 CONFIGURACIÓN DE EMAIL - DOMINIO VERIFICADO ✅
// ================================================================

export const EMAIL_CONFIG = {
  // 📧 SERVICIO DE EMAIL (cambiar por el que uses)
  provider: "resend", // opciones: "resend", "sendgrid", "mailgun"

  // 🔑 CREDENCIALES (añadir las tuyas aquí)
  apiKey: process.env.EMAIL_API_KEY || "TU_API_KEY_AQUI",

  // 📮 EMAILS DE ENVÍO - ¡DOMINIO VERIFICADO!
  fromEmail: "noreply@semzoprive.com", // ✅ Dominio verificado en Resend
  fromName: "Semzo Privé",

  // 📧 EMAIL DE CONTACTO
  contactEmail: "info@semzoprive.com", // Email para recibir respuestas

  // ⚙️ CONFIGURACIÓN AVANZADA
  replyTo: "info@semzoprive.com",

  // 🚀 MODO DE DESARROLLO (cambiar a false en producción)
  isDevelopment: process.env.NODE_ENV !== "production",

  // 📊 CONFIGURACIÓN POR PROVEEDOR
  providers: {
    resend: {
      baseUrl: "https://api.resend.com",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
    sendgrid: {
      baseUrl: "https://api.sendgrid.com/v3",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
    mailgun: {
      baseUrl: "https://api.mailgun.net/v3",
      domain: process.env.MAILGUN_DOMAIN || "semzoprive.com",
    },
  },
}

// 🔒 CONFIGURACIÓN DE ADMIN
export const ADMIN_CONFIG = {
  // 🔑 CREDENCIALES DE ACCESO (cambiar estas)
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "semzo2024!",

  // 🛡️ CONFIGURACIÓN DE SEGURIDAD
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
  maxLoginAttempts: 5,

  // 📱 CONFIGURACIÓN DE ACCESO
  allowedIPs: [], // dejar vacío para permitir todas las IPs
  requireHTTPS: true, // cambiar a true en producción
}
