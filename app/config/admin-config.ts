// Configuración de administración
export const ADMIN_CONFIG = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "semzo2024!",
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
}
