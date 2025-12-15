import type { Metadata } from "next"
import CatalogSection from "../components/catalog-section"
import Navbar from "../components/navbar"
import Footer from "../components/footer"

export const metadata: Metadata = {
  title: "Catálogo de Bolsos de Lujo - Chanel, Dior, Louis Vuitton",
  description:
    "Explora nuestra colección exclusiva de bolsos de lujo disponibles para alquiler. Chanel, Dior, Louis Vuitton, Fendi y más marcas premium desde 59€/mes.",
  keywords: [
    "catálogo bolsos lujo",
    "chanel",
    "dior",
    "louis vuitton",
    "fendi",
    "prada",
    "gucci",
    "alquiler bolsos diseñador",
  ],
  openGraph: {
    title: "Catálogo de Bolsos de Lujo | Semzo Privé",
    description: "Descubre nuestra selección de bolsos de las mejores marcas. Alquiler desde 59€/mes con envío gratis.",
    images: ["/images/hero-luxury-bags.jpeg"],
    url: "https://semzoprive.com/catalog",
  },
  alternates: {
    canonical: "https://semzoprive.com/catalog",
  },
}

export default function CatalogPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <div className="bg-gradient-to-b from-rose-nude/10 to-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">Catálogo de Bolsos</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Explora nuestra exclusiva colección de bolsos de lujo disponibles para nuestras membresías. Cada pieza ha
              sido cuidadosamente seleccionada por su calidad, diseño y valor.
            </p>
          </div>
        </div>
        <CatalogSection />
      </main>
      <Footer />
    </>
  )
}
