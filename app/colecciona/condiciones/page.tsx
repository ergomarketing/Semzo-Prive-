import type { Metadata } from "next"
import { LegalDoc } from "@/app/components/legal-doc"
import { buildConditionsBlocks } from "@/lib/colecciona-legal"

export const metadata: Metadata = {
  title: "Condiciones del Programa Colecciona | Semzo Privé",
  description: "Condiciones del programa Colecciona de Semzo Privé: crédito, precio, compra, factura y desistimiento.",
  alternates: { canonical: "https://semzoprive.com/colecciona/condiciones" },
}

export default function ColeccionaConditionsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3 py-16">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="rounded-xl bg-white p-8 shadow-xl md:p-12">
          <LegalDoc blocks={buildConditionsBlocks()} />
        </div>
      </div>
    </main>
  )
}
