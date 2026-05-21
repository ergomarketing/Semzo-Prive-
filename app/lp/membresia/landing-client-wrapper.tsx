"use client"

import dynamic from "next/dynamic"

// Importacion dinamica sin SSR para evitar mismatch de hidratacion
// con HTML cacheado por Next tras edits del componente.
const LandingMembresia = dynamic(() => import("./landing-membresia"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-rose-nude" />,
})

export default function LandingClientWrapper() {
  return <LandingMembresia />
}
