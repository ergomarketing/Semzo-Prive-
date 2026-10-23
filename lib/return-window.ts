/**
 * Ventana de devolucion: cuando el seguimiento de la etiqueta de VUELTA empieza a significar algo.
 *
 * La etiqueta de devolucion se crea junto con la de ida y viaja con el bolso, asi que Correos puede dar eventos de
 * esa etiqueta desde el primer dia (admision, "en transito"…) sin que el bolso haya vuelto. Se considera que el bolso
 * puede estar volviendo cuando faltan RETURN_WINDOW_DAYS o menos para el fin de la reserva, o cuando esta vencida.
 * Un estado "entregado" de la etiqueta de vuelta cuenta siempre (es inequivoco).
 */
export const RETURN_WINDOW_DAYS = 3

export function isReturnWindowOpen(endDate: string | null | undefined, reservationStatus: string | null | undefined): boolean {
  if (reservationStatus === "overdue") return true
  if (!endDate) return false
  return new Date(endDate).getTime() - Date.now() <= RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000
}
