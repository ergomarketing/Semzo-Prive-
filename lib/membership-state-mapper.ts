/**
 * MEMBERSHIP STATE MAPPER
 * 
 * Centraliza el mapeo entre estados de DB y estados de UI.
 * Source of Truth: membership_intents.status
 * 
 * Estados DB (membership_intents):
 * - initiated: Pago iniciado, esperando confirmación de Stripe
 * - paid_pending_verification: Pago completado, esperando verificación de identidad
 * - active: Membresía completamente activa
 * - expired: Membresía expirada
 * - cancelled: Membresía cancelada
 * 
 * Estados UI (para mostrar al usuario):
 * - pending_payment: Pago en proceso (mapea initiated)
 * - pending_verification: Esperando verificación (mapea paid_pending_verification)
 * - active: Activa (mapea active)
 * - expired: Expirada (mapea expired)
 * - cancelled: Cancelada (mapea cancelled)
 * - inactive: Sin membresía activa
 */

export type MembershipDBStatus = 
  | 'initiated' 
  | 'paid_pending_verification' 
  | 'active' 
  | 'expired' 
  | 'cancelled'

export type MembershipUIStatus = 
  | 'pending_payment' 
  | 'pending_verification' 
  | 'active' 
  | 'expired' 
  | 'cancelled' 
  | 'inactive'

/**
 * Mapea el estado de DB al estado de UI
 */
export function mapDBStatusToUI(dbStatus: MembershipDBStatus | null | undefined): MembershipUIStatus {
  if (!dbStatus) return 'inactive'
  
  const statusMap: Record<MembershipDBStatus, MembershipUIStatus> = {
    'initiated': 'pending_payment',
    'paid_pending_verification': 'pending_verification',
    'active': 'active',
    'expired': 'expired',
    'cancelled': 'cancelled',
  }
  
  return statusMap[dbStatus] || 'inactive'
}

/**
 * Labels amigables en español para cada estado UI
 */
export function getStatusLabel(uiStatus: MembershipUIStatus): string {
  const labels: Record<MembershipUIStatus, string> = {
    'pending_payment': 'Procesando pago...',
    'pending_verification': 'Pendiente verificación',
    'active': 'Activa',
    'expired': 'Expirada',
    'cancelled': 'Cancelada',
    'inactive': 'Free',
  }
  
  return labels[uiStatus] || 'Desconocido'
}

/**
 * Descripciones para cada estado UI
 */
export function getStatusDescription(uiStatus: MembershipUIStatus, membershipType?: string): string {
  if (uiStatus === 'pending_payment') return 'Procesando tu pago'
  if (uiStatus === 'pending_verification') return 'Verifica tu identidad para activar'
  if (uiStatus !== 'active') return 'Acceso básico'
  
  switch (membershipType) {
    case 'petite':
      return 'Acceso semanal + pases'
    case 'lessentiel':
      return 'Acceso a L\'Essentiel'
    case 'signature':
      return 'Acceso a Signature + L\'Essentiel'
    case 'prive':
      return 'Acceso completo'
    default:
      return 'Acceso básico'
  }
}
