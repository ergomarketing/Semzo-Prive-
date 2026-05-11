/*
 * Banner deslizante de testimonios.
 * Antes era un grid vertical que ocupaba ~800-1000px en movil y alargaba
 * el scroll. Ahora es un marquee horizontal compacto (~280px de alto) que:
 *  - Se desliza solo lentamente (60s) en bucle infinito.
 *  - Pausa al hover/touch para que el usuario lea con calma.
 *  - Duplica el array de testimonios para que la transicion sea continua
 *    sin saltos visibles (tecnica estandar de marquee infinito CSS).
 *  - Respeta prefers-reduced-motion (definido en globals.css).
 * Paleta Semzo: rose-nude / rose-pastel / indigo-dark.
 */
const TESTIMONIALS = [
  {
    quote:
      "Semzo Privé ha transformado mi relación con la moda de lujo. Ahora puedo acceder a bolsos que antes solo podía admirar en revistas.",
    author: "María González",
    role: "Empresaria",
  },
  {
    quote:
      "La calidad del servicio es impecable. Desde la selección hasta la entrega, cada detalle refleja el compromiso con la excelencia.",
    author: "Carmen Ruiz",
    role: "Directora Creativa",
  },
  {
    quote:
      "Lo que más valoro es la flexibilidad. Puedo cambiar mi bolso según la temporada o mi estado de ánimo, sin comprometerme a una compra permanente.",
    author: "Laura Martínez",
    role: "Arquitecta",
  },
]

export default function TestimonialSection() {
  // Duplicamos el array para que el marquee sea visualmente continuo.
  // Al llegar al -50% del ancho, vuelve al 0% y como el segundo array es
  // identico al primero el usuario no nota el "salto".
  const items = [...TESTIMONIALS, ...TESTIMONIALS]

  return (
    <section
      id="testimonios"
      className="py-12 md:py-16 bg-gradient-to-b from-rose-nude/8 via-rose-pastel/12 to-rose-nude/8 overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-10">
          <p className="text-xs uppercase tracking-widest text-indigo-dark mb-3 font-medium">Testimonios</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-slate-900 leading-tight">
            Lo que dicen nuestras clientas
          </h2>
        </div>

        {/*
         * Contenedor overflow-hidden + track con animacion infinita.
         * El mask-image suaviza los bordes laterales (fade out) para que
         * las tarjetas no aparezcan/desaparezcan bruscamente al entrar/salir.
         */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          }}
        >
          <div className="testimonials-track gap-4 md:gap-6 py-4">
            {items.map((t, i) => (
              <article
                key={i}
                className="flex-shrink-0 w-[80vw] sm:w-[420px] md:w-[460px] bg-white/80 backdrop-blur-sm border-l-4 border-rose-pastel rounded-r-lg p-5 md:p-6 shadow-sm"
              >
                <blockquote className="font-serif text-base md:text-lg text-slate-900 italic mb-4 line-clamp-4 md:line-clamp-none">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div>
                  <div className="font-medium text-indigo-dark text-sm md:text-base">{t.author}</div>
                  <div className="text-xs md:text-sm text-slate-600">{t.role}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
