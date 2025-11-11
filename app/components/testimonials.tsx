import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

const testimonials = [
  {
    id: 1,
    quote: "Semzo me hizo sentir como si tuviera un armario mágico. ¡Nunca me repito bolso!",
    name: "María González",
    role: "Empresaria",
    avatar: "/images/testimonials/maria.jpg",
  },
  {
    id: 2,
    quote: "Es como tener una amiga en todos los contactos top de mundo de la moda.",
    name: "Carmen Ruiz",
    role: "Influencer",
    avatar: "/images/testimonials/carmen.jpg",
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-rose-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-16 font-serif text-center">
            La Comunidad Semzo
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <p className="text-lg text-slate-700 mb-6 italic leading-relaxed font-serif">"{testimonial.quote}"</p>
                  <div className="flex items-center">
                    <div className="relative h-12 w-12 mr-4">
                      <Image
                        src={testimonial.avatar || "/placeholder.svg?height=48&width=48"}
                        alt={testimonial.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{testimonial.name}</h4>
                      <p className="text-sm text-slate-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
