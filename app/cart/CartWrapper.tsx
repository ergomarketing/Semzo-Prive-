"use client"

import dynamic from "next/dynamic"

const CartClient = dynamic(() => import("./CartClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white pt-32 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1a1a4b] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-[#1a1a4b]/70">Cargando carrito...</p>
      </div>
    </div>
  ),
})

export default function CartWrapper() {
  return <CartClient />
}
