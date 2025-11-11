import { Truck, RotateCcw, Clock, Heart } from "lucide-react"

export default function TrustBadges() {
  const badges = [
    {
      icon: Truck,
      title: "Envío Gratuito",
      description: "En toda España",
    },
    {
      icon: RotateCcw,
      title: "Cambios Ilimitados",
      description: "Sin restricciones",
    },
    {
      icon: Clock,
      title: "Atención 24/7",
      description: "Siempre disponible",
    },
    {
      icon: Heart,
      title: "Satisfacción",
      description: "Garantizada",
    },
  ]

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-rose-nude/8 to-rose-nude/5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {badges.map((badge, index) => (
            <div key={index} className="text-center group">
              <div className="flex justify-center mb-3 md:mb-4">
                <div className="p-2 md:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 group-hover:border-indigo-dark transition-colors duration-300">
                  <badge.icon className="h-5 w-5 md:h-6 md:w-6 text-indigo-dark" />
                </div>
              </div>
              <h3 className="text-xs md:text-sm font-semibold text-slate-900 mb-1">{badge.title}</h3>
              <p className="text-xs text-slate-600">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
