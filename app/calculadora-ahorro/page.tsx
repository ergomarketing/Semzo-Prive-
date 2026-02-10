import SavingsCalculator from "@/app/components/savings-calculator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Calculadora de Ahorro | SEMZO Privé",
  description:
    "Descubre cuánto puedes ahorrar al rentar bolsos de lujo en lugar de comprarlos. Calcula tu ahorro personalizado con SEMZO Privé.",
}

export default function CalculadoraAhorroPage() {
  return (
    <main className="min-h-screen bg-white">
      <SavingsCalculator />
    </main>
  )
}
