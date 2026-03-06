"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function CollectionSection() {
  const brands = [
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
  ]

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

        {/* Galería editorial — imagen lifestyle con overlay */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden mb-12">
          <Image
            src="/images/hero-luxury-bags.jpg"
            alt="Alquiler de bolsos de lujo — Semzo Privé"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Overlay degradado oscuro de izquierda a centro */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

          {/* Contenido editorial sobre la imagen */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
            <p className="text-xs uppercase tracking-widest text-white/70 mb-4 font-medium">
              Descubre la colección
            </p>
            <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight mb-4 max-w-lg">
              Un armario curado de bolsos icónicos de las casas más influyentes del mundo.
            </h3>
            <p className="text-white/75 text-base md:text-lg font-light mb-8 max-w-md">
              Accede a piezas excepcionales cuando tu vida lo necesite.
            </p>
            <div>
              <Link href="/catalog">
                <Button className="rounded-none px-8 py-5 text-xs uppercase tracking-widest font-medium bg-white text-indigo-dark hover:bg-rose-pastel hover:text-indigo-dark transition-all duration-300">
                  Explorar bolsos
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <p className="text-xs uppercase tracking-widest mb-6 font-medium text-indigo-dark text-center">
            Marcas destacadas
          </p>

          <style jsx>{`
            @keyframes marquee {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            
            .marquee-container {
              overflow: hidden;
              mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
              -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
            }
            
            .marquee-content {
              display: flex;
              animation: marquee 30s linear infinite;
              width: max-content;
            }
            
            .marquee-content:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="marquee-container py-4 border-y border-slate-200">
            <div className="marquee-content">
              {/* Duplicamos las marcas para crear el loop infinito */}
              {[...brands, ...brands].map((brand, index) => (
                <span
                  key={`${brand}-${index}`}
                  className="font-serif text-xl md:text-2xl lg:text-3xl text-slate-900 hover:text-indigo-dark transition-colors duration-300 whitespace-nowrap mx-6 md:mx-10 lg:mx-14 cursor-pointer"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Link href="/catalog">
            <Button className="rounded-none px-8 md:px-12 py-4 md:py-6 text-sm uppercase tracking-widest font-medium bg-white/80 backdrop-blur-sm transition-all duration-300 border border-slate-200 text-slate-900 hover:bg-white">
              Ver catálogo completo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
