"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function InvitacionClient() {
  const [copied, setCopied] = useState(false)
  const codigoDescuento = "PRIVE50"

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codigoDescuento)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header minimalista */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-serif text-[#1a1a4b]">
            SEMZO PRIVÉ
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/semzo-20priv-c3-a9.png"
              alt="Semzo Privé"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>

          {/* Título principal */}
          <h1 className="mb-4 font-serif text-4xl text-[#1a1a4b] md:text-5xl">Has Sido Invitada</h1>

          {/* Subtítulo */}
          <p className="mb-8 text-lg text-gray-600 leading-relaxed">
            Te damos la bienvenida a nuestro círculo exclusivo de mujeres que aprecian el lujo consciente y el estilo
            atemporal.
          </p>

          {/* Tarjeta del código */}
          <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <p className="mb-4 text-sm uppercase tracking-wider text-gray-500">Tu Código Exclusivo</p>

            <div className="mb-6 flex items-center justify-center gap-4">
              <span className="font-serif text-4xl font-bold tracking-wider text-[#1a1a4b]">{codigoDescuento}</span>
              <button
                onClick={handleCopyCode}
                className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
                aria-label="Copiar código"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5 text-gray-600" />}
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <p className="text-2xl font-semibold text-[#1a1a4b]">50% de Descuento</p>
              <p className="text-sm text-gray-600">En tu primera membresía mensual</p>
            </div>
          </div>

          {/* Beneficios */}
          <div className="mb-12 space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Acceso a nuestra colección de bolsos de diseñador</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Piezas auténticas y verificadas con garantía</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Envío gratuito y devoluciones sin complicaciones</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#1a1a4b]" />
              <p className="text-gray-700">Comunidad exclusiva de mujeres con estilo</p>
            </div>
          </div>

          {/* CTA */}
          <Link href="/membresias">
            <Button size="lg" className="w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 md:w-auto">
              Activar Mi Membresía
            </Button>
          </Link>

          {/* Nota legal */}
          <p className="mt-6 text-xs text-gray-500">
            El código de descuento se aplica automáticamente al ingresar{" "}
            <span className="font-semibold">{codigoDescuento}</span> durante el proceso de compra. Válido solo para
            nuevas clientas.
          </p>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Semzo Privé. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
