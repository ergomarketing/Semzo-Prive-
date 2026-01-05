import CatalogSection from "../components/catalog-section"
import Navbar from "../components/navbar"
import Footer from "../components/footer"

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
