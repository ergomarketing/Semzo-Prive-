// Configuración de administración
export const ADMIN_CONFIG = {
  username: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mailbox@semzoprive.com",
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Semzoprive1*",
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
}
