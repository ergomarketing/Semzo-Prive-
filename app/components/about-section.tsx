import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function AboutSection() {
  return (
    <section className="py-20 bg-rose-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 font-serif">¿Qué es Semzo Privé?</h2>
            <p className="text-xl text-slate-600 mb-6 leading-relaxed">
              Atesorando momentos en entreescaale flexibil montlo sutrisusabscrbco.
            </p>
            <p className="text-lg text-slate-700 mb-8 leading-relaxed">Más que bolsos, momentos únicos.</p>
            <Button
              className="text-white font-semibold px-8 py-3 text-lg hover:opacity-90 transition-all duration-300 rounded-xl"
              style={{ backgroundColor: "#1e293b" }}
            >
              DESCUBRE CÓMO FUNCIONA
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/chanel-signature.jpeg"
                  alt="Chanel - Elegancia parisina"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-bold drop-shadow-lg">Chanel</div>
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/dior-paris.jpeg"
                  alt="Dior - Sofisticación francesa"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-lg font-bold drop-shadow-lg">Dior</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
