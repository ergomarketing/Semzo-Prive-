import { Button } from "@/components/ui/button"

export default function ExclusiveAccess() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 font-serif">
                Acceso Anticipado + Beneficio Exclusivo
              </h2>
              <p className="text-xl text-slate-600 mb-6">Solo 50 plazas disponibles</p>
              <p className="text-lg text-slate-700 mb-8">Recevera ata un ano descueleve algance a acceso limita edmi</p>
            </div>
            <div className="text-center">
              <Button
                size="lg"
                className="text-white font-semibold px-12 py-4 text-xl hover:opacity-90 transition-all duration-300 rounded-xl"
                style={{ backgroundColor: "#e879a6" }}
              >
                RESERVAR MI LUGAR
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
