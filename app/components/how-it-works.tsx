export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="py-24"
      style={{
        background:
          "linear-gradient(135deg, #fff0f3 0%, rgba(248, 232, 235, 0.4) 25%, rgba(240, 216, 221, 0.3) 50%, rgba(232, 200, 207, 0.2) 75%, rgba(244, 196, 204, 0.1) 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        {/* Encabezado editorial */}
        <div className="grid md:grid-cols-12 gap-8 mb-20">
          <div className="md:col-span-4">
            <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
              El proceso
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
              Simplicidad y elegancia en cada paso
            </h2>
          </div>
          <div className="md:col-span-1"></div>
          <div className="md:col-span-7">
            <p className="text-slate-600 text-lg leading-relaxed font-light">
              Hemos diseñado un proceso intuitivo que te permite disfrutar de bolsos de lujo sin complicaciones. Desde
              la selección hasta la entrega, cada detalle ha sido cuidadosamente considerado.
            </p>
          </div>
        </div>

        {/* Pasos en formato editorial */}
        <div className="grid md:grid-cols-3 gap-x-8 gap-y-16">
          {[
            {
              number: "01",
              title: "Selecciona tu membresía",
              description: "Elige entre nuestros tres niveles de membresía según tus necesidades y preferencias.",
            },
            {
              number: "02",
              title: "Explora nuestra colección",
              description: "Navega por nuestro catálogo curado de bolsos de las marcas más prestigiosas del mundo.",
            },
            {
              number: "03",
              title: "Recibe y disfruta",
              description: "Tu selección llegará a tu puerta en un packaging exclusivo, lista para ser disfrutada.",
            },
          ].map((step) => (
            <div
              key={step.number}
              className="pt-8 p-6 rounded-lg backdrop-blur-sm"
              style={{
                borderTop: "1px solid rgba(244, 196, 204, 0.3)",
                backgroundColor: "rgba(255, 240, 243, 0.3)",
              }}
            >
              <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                Paso {step.number}
              </div>
              <h3 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
                {step.title}
              </h3>
              <p className="text-slate-600 font-light">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
