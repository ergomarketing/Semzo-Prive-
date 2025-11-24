"use client"

import { Button } from "../../../components/ui/button"
import Link from "next/link"

export default function CollectionSection() {
  return (
    <section
      id="coleccion"
      className="py-16 md:py-24 bg-gradient-to-b from-rose-nude/5 via-rose-pastel/8 to-rose-nude/5"
    >
      <div className="container mx-auto px-4">
        {/* Encabezado editorial - optimizado para móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12 md:mb-20">
          <div className="lg:col-span-4 text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest mb-4 md:mb-6 font-medium text-indigo-dark">
              Nuestra colección
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-slate-900">
              Piezas icónicas, experiencias memorables
            </h2>
          </div>
          <div className="hidden lg:block lg:col-span-1"></div>
          <div className="lg:col-span-7">
            <p className="text-slate-600 text-base md:text-lg leading-relaxed font-light text-center lg:text-left">
              Cada bolso cuenta una historia de artesanía excepcional y diseño atemporal. Nuestra colección curada
              incluye piezas icónicas de las casas de moda más prestigiosas del mundo, seleccionadas por su belleza,
              calidad y relevancia cultural.
            </p>
          </div>
        </div>

        {/* Galería editorial - stack en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Imagen principal */}
          <div className="lg:col-span-8 relative">
            <div className="relative aspect-[4/3] md:aspect-[16/9] bg-white rounded-lg flex items-center justify-center">
              <div className="text-center p-6 md:p-8">
                <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-rose-pastel/20 flex items-center justify-center">
                  <span className="text-2xl md:text-4xl text-indigo-dark">SP</span>
                </div>
                <h3 className="text-lg md:text-xl font-serif text-slate-900 mb-2">Imagen Colección</h3>
                <p className="text-sm text-slate-600">Colección de bolsos de lujo</p>
              </div>
            </div>
          </div>

          {/* Columna lateral - mejor en móvil */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="pb-6 md:pb-8 border-b border-slate-200">
              <p className="text-xs uppercase tracking-widest mb-4 font-medium text-indigo-dark text-center lg:text-left">
                Marcas destacadas
              </p>
              <style jsx>{`
                @keyframes fadeInUp {
                  from {
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                
                @keyframes gentleFloat {
                  0%, 100% {
                    transform: translateY(0px);
                  }
                  50% {
                    transform: translateY(-3px);
                  }
                }
                
                .brand-item {
                  animation: fadeInUp 0.6s ease-out forwards;
                  opacity: 0;
                }
                
                .brand-item:hover {
                  animation: gentleFloat 2s ease-in-out infinite;
                  transform: translateY(-2px);
                  transition: all 0.3s ease;
                }
              `}</style>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                {[
                  "Bottega Veneta",
                  "Burberry",
                  "Celine",
                  "Chanel",
                  "Christian Dior",
                  "Fendi",
                  "Hermès",
                  "Goyard",
                  "Gucci",
                  "Loewe",
                  "Louis Vuitton",
                  "Prada",
                  "Saint Laurent",
                ].map((brand, index) => (
                  <div
                    key={brand}
                    className="brand-item border-b border-slate-100 pb-2 lg:pb-3 text-center lg:text-left cursor-pointer"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                    }}
                  >
                    <span className="font-serif text-xl lg:text-2xl text-slate-900 hover:text-indigo-dark transition-colors duration-300">
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/catalog">
              <Button className="rounded-none px-6 md:px-8 py-4 md:py-6 text-sm uppercase tracking-widest font-medium w-full bg-white/80 backdrop-blur-sm transition-all duration-300 border border-slate-200 text-slate-900 hover:bg-white">
                Ver catálogo completo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
