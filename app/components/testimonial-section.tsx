export default function TestimonialSection() {
  return (
    <section
      id="testimonios"
      className="py-16 md:py-24 bg-gradient-to-b from-rose-nude/8 via-rose-pastel/12 to-rose-nude/8"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna izquierda */}
          <div className="lg:col-span-5 text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest text-indigo-dark mb-4 md:mb-6 font-medium">Testimonios</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-slate-900 leading-tight mb-6 md:mb-8">
              Lo que dicen nuestras clientas
            </h2>

            <div className="relative aspect-[4/5] w-full max-w-sm mx-auto lg:max-w-none rounded-lg overflow-hidden bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center p-6 md:p-8">
                <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-rose-pastel/20 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl lg:text-4xl text-indigo-dark">SP</span>
                </div>
                <h3 className="text-lg md:text-xl font-serif text-slate-900 mb-2">Imagen Testimonio</h3>
                <p className="text-sm text-slate-600">Clienta satisfecha</p>
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="lg:col-span-6 lg:col-start-7 flex flex-col justify-center">
            <div className="space-y-8 md:space-y-16">
              {[
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
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="pl-4 md:pl-8 p-4 md:p-6 rounded-r-lg bg-white/80 backdrop-blur-sm border-l-4 border-rose-pastel"
                >
                  <blockquote className="font-serif text-lg md:text-xl lg:text-2xl text-slate-900 italic mb-4 md:mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <div className="font-medium text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
