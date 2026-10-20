/**
 * Traduce el estado que devuelve Correos ("estadoEnvio") al estado interno de un envio.
 *
 * Importante: antes TODO estado desconocido se guardaba como "in_transit". Asi un paquete en PRE-ADMISION
 * (la etiqueta existe pero la socia aun no lo ha entregado en Correos) figuraba como "en camino" cuando en
 * realidad no se habia enviado. Ahora los estados conocidos se mapean explicitamente y los desconocidos NO
 * cambian el estado guardado (devuelve null).
 */
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export function mapCorreosStatus(raw: string | null | undefined): string | null {
  const key = normalize(String(raw || ""))
  if (!key) return null
  // Etiqueta creada pero el paquete aun no esta en manos de Correos
  if (/^(PRE ?ADMISION|PREADMISION|PRE ?REGISTRAD[OA]|PREREGISTRAD[OA]|PENDIENTE|ETIQUETA CREADA)/.test(key)) return "pending"
  if (/ENTREGAD[OA]|ENTREGA REALIZADA/.test(key)) return "delivered"
  if (/EN REPARTO|REPARTO/.test(key)) return "out_for_delivery"
  if (/EN TRANSITO|TRANSITO|ADMITID[OA]|ADMISION|EN CAMINO|CLASIFICAD[OA]|EN DISTRIBUCION/.test(key)) return "in_transit"
  return null
}
