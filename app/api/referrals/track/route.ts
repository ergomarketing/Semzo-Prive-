/**
 * Alias deprecated del antiguo endpoint POST /api/referrals/track.
 *
 * Se mantiene SOLO para no romper clientes ya desplegados (signup pages
 * antiguas o paginas cacheadas en navegadores) que sigan llamando a
 * `/api/referrals/track`. Internamente delega al nuevo endpoint oficial
 * `POST /api/referrals/apply`, que aplica las mismas validaciones.
 *
 * Eliminar este archivo cuando estemos seguros de que ningun cliente
 * vivo llama ya a `/track`.
 */
export { POST } from "../apply/route"
