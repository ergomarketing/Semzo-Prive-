// 📧 CONFIGURACIÓN SOHOMAIL SMTP - CREDENCIALES REALES
// ================================================================

export const SOHOMAIL_CONFIG = {
  // 🔑 CREDENCIALES SMTP SOHOMAIL
  smtp: {
    host: "smtp.zoho.com",
    port: 587, // TLS
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: "mailbox@semzoprive.com",
      pass: "Semzoprive1*",
    },
    tls: {
      rejectUnauthorized: false,
    },
  },

  // 📮 CONFIGURACIÓN DE EMAILS
  from: {
    email: "mailbox@semzoprive.com",
    name: "Semzo Privé",
  },

  // 📧 EMAILS ESPECÍFICOS POR TIPO
  emails: {
    reservations: "reservas@semzoprive.com",
    payments: "pagos@semzoprive.com",
    contact: "contacto@semzoprive.com",
    newsletter: "newsletter@semzoprive.com",
    admin: "admin@semzoprive.com",
  },

  // ⚙️ CONFIGURACIÓN AVANZADA
  options: {
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  },
}
