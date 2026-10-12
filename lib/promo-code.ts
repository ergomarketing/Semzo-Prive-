/**
 * Codigo de bienvenida (50 % primera mensualidad) compartido entre el pop-up de
 * /membresias y el carrito. El pop-up lo deja pendiente en sessionStorage y
 * /cart lo aplica una sola vez al cargar (app/cart/CartClient.tsx).
 */
export const WELCOME_PROMO_CODE = "PRIVE50"
export const PENDING_PROMO_KEY = "semzo_pending_promo"

export function setPendingPromo(code: string = WELCOME_PROMO_CODE) {
  try {
    sessionStorage.setItem(PENDING_PROMO_KEY, code)
  } catch {
    // sessionStorage no disponible: la clienta puede escribir el codigo a mano
  }
}
