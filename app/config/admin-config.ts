// Configuración de administración.
// Las credenciales se leen SOLO desde variables de entorno server-side
// (nunca NEXT_PUBLIC_*) — no hay fallbacks hardcodeados.
export const ADMIN_CONFIG = {
  // Usado como identificador de display; la autenticación real ocurre en
  // /api/admin/login comparando con ADMIN_EMAIL y ADMIN_PASSWORD server-side.
  email: process.env.ADMIN_EMAIL ?? "",
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas en ms
}
