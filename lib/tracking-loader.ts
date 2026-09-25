/**
 * Cargador de tracking (Google Tag Manager + pixel de TikTok).
 *
 * Por que existe: GTM (con GA4 y los destinos de Google Ads) y TikTok suponian
 * ~70 % del Total Blocking Time movil en PageSpeed (~530 ms de tareas largas).
 *
 * Regla (se ejecuta como script inline afterInteractive desde app/layout.tsx):
 *
 *  CARGA INMEDIATA (igual que antes) cuando:
 *   - la URL trae senal de campaña/anuncio: gclid, gbraid, wbraid, dclid,
 *     gad_source, fbclid, ttclid, msclkid, twclid, srsltid o cualquier utm_*
 *     -> asi la cookie de conversion de Google Ads (Conversion Linker) y el
 *     clic de anuncio SIEMPRE se registran, aunque el usuario navegue rapido;
 *   - ya hay un primer/ultimo contacto con senal guardado (semzo_last_touch,
 *     escrito por lib/attribution-client.ts): visitante que ya llego por
 *     campaña o referrer externo;
 *   - la pagina NO esta en la lista de paginas de contenido: /lp/* (landings de
 *     anuncios), /signup, /cart, /checkout, /post-checkout, /dashboard...
 *     (todo el embudo y las conversiones cargan al instante).
 *
 *  CARGA DIFERIDA solo en paginas de contenido (/, /blog*, /proceso,
 *  /membresias, /colecciona) para visitas SIN senal: se carga en la primera
 *  interaccion (scroll, toque, clic, tecla, raton) o a los 4 s, lo que ocurra
 *  antes. Los eventos que la web empuje a dataLayer antes de que cargue GTM
 *  quedan en cola y se procesan al iniciarse, no se pierden.
 *
 * Coste conocido: una visita organica que se va en <4 s SIN interactuar no se
 * cuenta en Analytics. Si esto no interesa, basta con vaciar
 * DELAYABLE_FIRST_SEGMENTS y todo vuelve a cargar de inmediato.
 *
 * NOTA: el JS va en un template literal sin regex con barras invertidas (un
 * '\/' dentro de un template literal se "traga" la barra). Mantenerlo asi.
 */

export const GTM_ID = "GTM-K3C577WM"
export const TIKTOK_PIXEL_ID = "D4A7JSJC77U1BLONR900"

/** Primer segmento de ruta de las paginas de contenido donde se puede diferir (ademas de "/"). */
export const DELAYABLE_FIRST_SEGMENTS = ["blog", "proceso", "membresias", "colecciona"]

/** Milisegundos hasta cargar el tracking si no hay ninguna interaccion. */
export const TRACKING_FALLBACK_MS = 4000

export const TRACKING_LOADER_SCRIPT = `(function () {
  var started = false;
  var timer = null;
  var interactionEvents = ['scroll', 'pointerdown', 'touchstart', 'keydown', 'mousemove'];

  function loadGtm() {
    var w = window;
    var d = document;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = d.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';
    var first = d.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(s, first);
  }

  function loadTikTok() {
    window.TiktokAnalyticsObject = 'ttq';
    var ttq = window.ttq = window.ttq || [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (t, e) {
      t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
    };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.load = function (e) { ttq._i = ttq._i || {}; ttq._i[e] = []; };
    ttq.load('${TIKTOK_PIXEL_ID}');
    ttq.page();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${TIKTOK_PIXEL_ID}&lib=ttq';
    document.head.appendChild(s);
  }

  function start() {
    if (started) return;
    started = true;
    if (timer) clearTimeout(timer);
    for (var i = 0; i < interactionEvents.length; i++) {
      window.removeEventListener(interactionEvents[i], start, true);
    }
    loadGtm();
    // TikTok tras el evento load, como cuando era strategy="lazyOnload".
    if (document.readyState === 'complete') loadTikTok();
    else window.addEventListener('load', loadTikTok);
  }

  function hasCampaignSignal() {
    try {
      if (/[?&](gclid|gbraid|wbraid|dclid|gad_source|fbclid|ttclid|msclkid|twclid|srsltid|utm_[a-z_]+)=/i.test(location.search)) return true;
      // Primer/ultimo contacto con senal guardado por lib/attribution-client.ts
      if (localStorage.getItem('semzo_last_touch')) return true;
    } catch (e) {}
    return false;
  }

  var path = location.pathname;
  var firstSegment = path.split('/')[1] || '';
  var delayable = path === '/' || ${JSON.stringify(DELAYABLE_FIRST_SEGMENTS)}.indexOf(firstSegment) !== -1;

  if (!delayable || hasCampaignSignal()) {
    start();
    return;
  }

  for (var i = 0; i < interactionEvents.length; i++) {
    window.addEventListener(interactionEvents[i], start, { capture: true, passive: true });
  }
  timer = setTimeout(start, ${TRACKING_FALLBACK_MS});
})();`
